import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { AlertCircle, Clock3, LoaderCircle, Mic, MicOff, PhoneOff, Send, ShieldCheck, Trash2, Volume2, Wifi } from 'lucide-react';
import { YukotoVoiceCharacter, type YukotoVoiceMode } from '../components/YukotoVoiceCharacter';
import { buildYukotoMandarinInstruction, YUKOTO_LEVEL_LABELS, type YukotoTrack } from '../lib/yukotoMandarinInstruction';
import './YukotoConversationPage.css';

type Track = YukotoTrack;
type TranscriptMessage = { id: string; role: 'user' | 'assistant'; text: string; time: string };
type ServerMessage = {
  setupComplete?: Record<string, unknown>;
  error?: { message?: string; code?: number };
  serverContent?: {
    inputTranscription?: { text?: string };
    outputTranscription?: { text?: string };
    modelTurn?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string }; text?: string }> };
    turnComplete?: boolean;
    interrupted?: boolean;
  };
};

const TOKEN_URL = (import.meta as ImportMeta & { env: { VITE_YUKOTO_TOKEN_URL?: string } }).env.VITE_YUKOTO_TOKEN_URL || '';
const MAX_SESSION_SECONDS = 8 * 60;
const MODEL = 'gemini-3.8-live';
const LEVELS: Array<{ value: Track; label: string }> = Object.entries(YUKOTO_LEVEL_LABELS).map(([value, label]) => ({ value: value as Track, label }));

type CurriculumWordRecord = { hanzi: string; levels: string[] };
type Props = { initialLevel?: string; maxSessionSeconds?: number; curriculumEntries?: CurriculumWordRecord[] };
const NO_CURRICULUM_ENTRIES: CurriculumWordRecord[] = [];

function base64ToBytes(encoded: string): Uint8Array {
  const binary = window.atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function pcm16ToFloat32(data: Uint8Array): Float32Array {
  const sampleCount = Math.floor(data.byteLength / 2);
  const result = new Float32Array(sampleCount);
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  for (let i = 0; i < sampleCount; i += 1) result[i] = view.getInt16(i * 2, true) / 32768;
  return result;
}

function floatToPcm16Base64(data: Float32Array): string {
  const bytes = new Uint8Array(data.length * 2);
  const view = new DataView(bytes.buffer);
  for (let i = 0; i < data.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, data[i]));
    view.setInt16(i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }
  let binary = '';
  const step = 0x8000;
  for (let start = 0; start < bytes.length; start += step) {
    binary += String.fromCharCode(...bytes.subarray(start, Math.min(start + step, bytes.length)));
  }
  return window.btoa(binary);
}

function downsample(input: Float32Array, inputRate: number, outputRate = 16000): Float32Array {
  if (inputRate === outputRate) return input;
  const ratio = inputRate / outputRate;
  const outputLength = Math.max(1, Math.floor(input.length / ratio));
  const output = new Float32Array(outputLength);
  for (let i = 0; i < outputLength; i += 1) {
    const start = Math.floor(i * ratio);
    const end = Math.min(Math.floor((i + 1) * ratio), input.length);
    let sum = 0;
    for (let j = start; j < end; j += 1) sum += input[j];
    output[i] = sum / Math.max(1, end - start);
  }
  return output;
}

function mergeTranscript(previous: string, incoming: string): string {
  if (!previous) return incoming;
  if (!incoming) return previous;
  if (incoming.startsWith(previous)) return incoming;
  if (previous.endsWith(incoming)) return previous;
  return `${previous}${incoming}`;
}

function hasLatinText(value: string): boolean {
  return /[A-Za-z]/.test(value);
}

function timeLabel(seconds: number): string {
  const minutes = Math.floor(Math.max(0, seconds) / 60).toString().padStart(2, '0');
  const remainder = Math.max(0, seconds) % 60;
  return `${minutes}:${remainder.toString().padStart(2, '0')}`;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return 'The voice session could not start. Please check the configuration and try again.';
}

export function YukotoConversationPage({ initialLevel = 'starter', maxSessionSeconds = MAX_SESSION_SECONDS, curriculumEntries }: Props) {
  const safeInitialLevel = LEVELS.some((item) => item.value === initialLevel) ? initialLevel as Track : 'starter';
  const [track, setTrack] = useState<Track>(safeInitialLevel);
  const [phase, setPhase] = useState<YukotoVoiceMode>('idle');
  const [statusText, setStatusText] = useState('准备好了吗？点击开始，然后用中文和我聊天。');
  const [errorText, setErrorText] = useState('');
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [userDraft, setUserDraft] = useState('');
  const [assistantDraft, setAssistantDraft] = useState('');
  const [typedText, setTypedText] = useState('');
  const [showTranscript, setShowTranscript] = useState(true);
  const [micMuted, setMicMuted] = useState(false);
  const [sessionStartedAt, setSessionStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [languageSlip, setLanguageSlip] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const availableCurriculumEntries = curriculumEntries ?? NO_CURRICULUM_ENTRIES;
  const curriculumWords = useMemo(() => {
    if (track === 'starter') return [];
    const [trackScheme, levelText] = track.split('-');
    const scheme = trackScheme === 'hsk20' ? 'old' : 'new';
    const level = Number(levelText);
    return availableCurriculumEntries
      .filter((entry) => entry.levels.some((tag) => {
        const [tagScheme, tagLevel] = tag.split('-');
        return tagScheme === scheme && Number(tagLevel) <= level;
      }))
      .slice(0, 24)
      .map((entry) => entry.hanzi);
  }, [availableCurriculumEntries, track]);

  const socketRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const silentGainRef = useRef<GainNode | null>(null);
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const playbackTimeRef = useRef(0);
  const activeOutputCountRef = useRef(0);
  const sessionTimeoutRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioLevelUpdateRef = useRef(0);
  const micMutedRef = useRef(false);
  const userDraftRef = useRef('');
  const assistantDraftRef = useRef('');
  const intentionalCloseRef = useRef(false);
  const sessionReadyRef = useRef(false);

  useEffect(() => { micMutedRef.current = micMuted; }, [micMuted]);
  useEffect(() => { if (LEVELS.some((item) => item.value === initialLevel)) setTrack(initialLevel as Track); }, [initialLevel]);

  const cleanDrafts = useCallback(() => {
    userDraftRef.current = '';
    assistantDraftRef.current = '';
    setUserDraft('');
    setAssistantDraft('');
  }, []);

  const stopOutputAudio = useCallback(() => {
    for (const source of audioSourcesRef.current) {
      try { source.stop(); } catch { /* Already ended. */ }
      try { source.disconnect(); } catch { /* Already disconnected. */ }
    }
    audioSourcesRef.current.clear();
    activeOutputCountRef.current = 0;
    playbackTimeRef.current = audioContextRef.current?.currentTime || 0;
    setAudioLevel(0);
  }, []);

  const stopConversation = useCallback(async (timeLimitReached = false) => {
    intentionalCloseRef.current = true;
    sessionReadyRef.current = false;
    if (sessionTimeoutRef.current !== null) window.clearTimeout(sessionTimeoutRef.current);
    sessionTimeoutRef.current = null;
    if (animationFrameRef.current !== null) window.cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = null;
    if (processorRef.current) {
      processorRef.current.onaudioprocess = null;
      try { processorRef.current.disconnect(); } catch { /* Already disconnected. */ }
    }
    try { micSourceRef.current?.disconnect(); } catch { /* Already disconnected. */ }
    try { silentGainRef.current?.disconnect(); } catch { /* Already disconnected. */ }
    micSourceRef.current = null;
    processorRef.current = null;
    silentGainRef.current = null;
    streamRef.current?.getTracks().forEach((trackItem) => trackItem.stop());
    streamRef.current = null;
    stopOutputAudio();
    const socket = socketRef.current;
    socketRef.current = null;
    if (socket && socket.readyState < WebSocket.CLOSING) socket.close(1000, 'Learner ended session');
    const context = audioContextRef.current;
    audioContextRef.current = null;
    if (context && context.state !== 'closed') {
      try { await context.close(); } catch { /* Browser may have closed it already. */ }
    }
    setPhase('idle');
    setSessionStartedAt(null);
    setAudioLevel(0);
    setMicMuted(false);
    setUserDraft('');
    setAssistantDraft('');
    userDraftRef.current = '';
    assistantDraftRef.current = '';
    intentionalCloseRef.current = false;
    if (timeLimitReached) setStatusText('本次练习时间已到。休息一下，或者稍后再来练习。');
    else setStatusText('对话已结束。想继续练习时，再开始一次吧。');
  }, [stopOutputAudio]);

  useEffect(() => {
    if (sessionStartedAt === null) return;
    const update = () => {
      const seconds = Math.max(0, Math.floor((Date.now() - sessionStartedAt) / 1000));
      setElapsed(seconds);
      if (seconds >= maxSessionSeconds) void stopConversation(true);
    };
    update();
    const intervalId = window.setInterval(update, 1000);
    return () => window.clearInterval(intervalId);
  }, [sessionStartedAt, maxSessionSeconds, stopConversation]);

  const schedulePcmAudio = useCallback((encoded: string) => {
    const context = audioContextRef.current;
    const analyser = outputAnalyserRef.current;
    if (!context || !analyser || context.state === 'closed') return;
    const samples = pcm16ToFloat32(base64ToBytes(encoded));
    if (!samples.length) return;
    const buffer = context.createBuffer(1, samples.length, 24000);
    buffer.copyToChannel(samples, 0);
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(analyser);
    const startAt = Math.max(context.currentTime + 0.015, playbackTimeRef.current);
    playbackTimeRef.current = startAt + buffer.duration;
    activeOutputCountRef.current += 1;
    audioSourcesRef.current.add(source);
    source.onended = () => {
      audioSourcesRef.current.delete(source);
      try { source.disconnect(); } catch { /* Already disconnected. */ }
      activeOutputCountRef.current = Math.max(0, activeOutputCountRef.current - 1);
      if (activeOutputCountRef.current === 0 && sessionReadyRef.current) {
        setPhase('listening');
        setStatusText('我在听。你可以继续说中文。');
      }
    };
    source.start(startAt);
    setPhase('speaking');
    setStatusText('正在说话。听一听，再用中文回答。');

    if (animationFrameRef.current === null) {
      const data = new Uint8Array(analyser.fftSize);
      const animateLevel = (time: number) => {
        animationFrameRef.current = window.requestAnimationFrame(animateLevel);
        if (time - audioLevelUpdateRef.current < 65) return;
        audioLevelUpdateRef.current = time;
        analyser.getByteTimeDomainData(data);
        let squareSum = 0;
        for (let i = 0; i < data.length; i += 1) {
          const normalized = (data[i] - 128) / 128;
          squareSum += normalized * normalized;
        }
        setAudioLevel(Math.min(1, Math.sqrt(squareSum / data.length) * 3.4));
        if (activeOutputCountRef.current === 0) {
          if (animationFrameRef.current !== null) window.cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
          setAudioLevel(0);
        }
      };
      animationFrameRef.current = window.requestAnimationFrame(animateLevel);
    }
  }, []);

  const finalizeTranscripts = useCallback(() => {
    const userText = userDraftRef.current.trim();
    const assistantText = assistantDraftRef.current.trim();
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const additions: TranscriptMessage[] = [];
    if (userText) additions.push({ id: `u-${Date.now()}-${Math.random()}`, role: 'user', text: userText, time: now });
    if (assistantText) {
      if (hasLatinText(assistantText)) {
        setLanguageSlip(true);
        setStatusText('检测到非中文转写，已隐藏这段文字。');
      } else {
        additions.push({ id: `a-${Date.now()}-${Math.random()}`, role: 'assistant', text: assistantText, time: now });
      }
    }
    if (additions.length) setMessages((current) => [...current, ...additions].slice(-40));
    cleanDrafts();
  }, [cleanDrafts]);

  const setupAudioCapture = useCallback(async (socket: WebSocket, stream: MediaStream, context: AudioContext) => {
    streamRef.current = stream;
    const analyser = context.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.72;
    analyser.connect(context.destination);
    outputAnalyserRef.current = analyser;
    const micSource = context.createMediaStreamSource(stream);
    micSourceRef.current = micSource;
    const processor = context.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;
    const silentGain = context.createGain();
    silentGain.gain.value = 0;
    silentGainRef.current = silentGain;
    processor.onaudioprocess = (event) => {
      if (!sessionReadyRef.current || micMutedRef.current || socket.readyState !== WebSocket.OPEN) return;
      const mono = event.inputBuffer.getChannelData(0);
      const pcm = floatToPcm16Base64(downsample(mono, context.sampleRate, 16000));
      socket.send(JSON.stringify({ realtimeInput: { audio: { data: pcm, mimeType: 'audio/pcm;rate=16000' } } }));
    };
    micSource.connect(processor);
    processor.connect(silentGain);
    silentGain.connect(context.destination);
  }, []);

  const startConversation = useCallback(async () => {
    if (!privacyAccepted) {
      setErrorText('Please read and accept the privacy notice before starting a voice session.');
      return;
    }
    if (!TOKEN_URL) {
      setErrorText('The Gemini endpoint is not configured yet. Deploy the Yukoto Worker and set VITE_YUKOTO_TOKEN_URL for your GitHub Pages build.');
      setPhase('error');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorText('Microphone access requires HTTPS (or localhost) and a supported browser.');
      setPhase('error');
      return;
    }

    setErrorText('');
    setLanguageSlip(false);
    setElapsed(0);
    cleanDrafts();
    setPhase('connecting');
    setStatusText('正在安全连接语音服务…');
    intentionalCloseRef.current = false;
    sessionReadyRef.current = false;
    stopOutputAudio();

    let socket: WebSocket | null = null;
    try {
      // Resume Web Audio directly from the user's click before network awaits, to respect browser autoplay policies.
      const AudioContextConstructor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextConstructor) throw new Error('This browser does not support Web Audio. Try a current version of Chrome, Edge, or Safari.');
      const audioContext = new AudioContextConstructor();
      audioContextRef.current = audioContext;
      await audioContext.resume();
      // Ask for microphone access after the learner explicitly starts the session.
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: false,
      });
      streamRef.current = stream;
      const response = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ track, curriculumWords }),
      });
      const payload = await response.json() as { token?: string; error?: string; expiresAt?: string };
      if (!response.ok || !payload.token) throw new Error(payload.error || `Token endpoint returned HTTP ${response.status}.`);

      const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained?access_token=${encodeURIComponent(payload.token)}`;
      socket = new WebSocket(url);
      socketRef.current = socket;
      let setupSettled = false;
      let socketOpened = false;
      let receivedServerMessages = 0;
      let setupResolve: (() => void) | undefined;
      let setupReject: ((reason?: Error) => void) | undefined;
      let setupTimeoutId: number | null = null;
      const setupPromise = new Promise<void>((resolve, reject) => {
        setupResolve = resolve;
        setupReject = reject;
        setupTimeoutId = window.setTimeout(() => {
          if (!setupSettled) {
            setupSettled = true;
            const detail = !socketOpened
              ? `The WebSocket did not open (state ${socket?.readyState ?? 'unavailable'}).`
              : receivedServerMessages === 0
                ? 'The WebSocket opened, but Gemini sent no setup response.'
                : `Gemini sent ${receivedServerMessages} message(s), but did not confirm setup.`;
            setupReject?.(new Error(`${detail} Timed out after 20 seconds. Check model access and network connection.`));
          }
        }, 20_000);
      });

      socket.onopen = () => {
        socketOpened = true;
        const systemInstruction = buildYukotoMandarinInstruction(track, curriculumWords);
        const setup = {
          setup: {
            model: `models/${MODEL}`,
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
            },
            systemInstruction: { parts: [{ text: systemInstruction }] },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
          },
        };
        socket?.send(JSON.stringify(setup));
      };

      socket.onmessage = async (event: MessageEvent) => {
        let message: ServerMessage;
        try {
          const rawMessage = typeof event.data === 'string'
            ? event.data
            : event.data instanceof Blob
              ? await event.data.text()
              : event.data instanceof ArrayBuffer
                ? new TextDecoder().decode(event.data)
                : null;
          if (rawMessage === null) throw new Error('Unsupported WebSocket message format.');
          message = JSON.parse(rawMessage) as ServerMessage;
        } catch {
          if (!setupSettled) {
            setupSettled = true;
            if (setupTimeoutId !== null) window.clearTimeout(setupTimeoutId);
            setupTimeoutId = null;
            setupReject?.(new Error('Gemini Live sent an unreadable setup response.'));
          } else {
            setErrorText('Gemini Live sent an unreadable response. End the session and try again.');
          }
          return;
        }
        receivedServerMessages += 1;
        if (message.error) {
          const detail = message.error.message || 'Gemini Live returned an error.';
          if (!setupSettled) {
            setupSettled = true;
            if (setupTimeoutId !== null) window.clearTimeout(setupTimeoutId);
            setupTimeoutId = null;
            setupReject?.(new Error(detail));
          } else {
            setErrorText(detail);
          }
          return;
        }
        if (message.setupComplete && !setupSettled) {
          setupSettled = true;
          if (setupTimeoutId !== null) window.clearTimeout(setupTimeoutId);
          setupTimeoutId = null;
          setupResolve?.();
          return;
        }
        const content = message.serverContent;
        if (!content) return;
        if (content.interrupted) {
          stopOutputAudio();
          setPhase('listening');
          setStatusText('没关系，你可以随时打断我。请继续说。');
        }
        if (content.inputTranscription?.text) {
          userDraftRef.current = mergeTranscript(userDraftRef.current, content.inputTranscription.text);
          setUserDraft(userDraftRef.current);
          if (activeOutputCountRef.current === 0) {
            setPhase('thinking');
            setStatusText('我在想一想…');
          }
        }
        if (content.outputTranscription?.text) {
          assistantDraftRef.current = mergeTranscript(assistantDraftRef.current, content.outputTranscription.text);
          setAssistantDraft(hasLatinText(assistantDraftRef.current) ? '' : assistantDraftRef.current);
          if (hasLatinText(assistantDraftRef.current)) setLanguageSlip(true);
        }
        for (const part of content.modelTurn?.parts || []) {
          if (part.inlineData?.data) schedulePcmAudio(part.inlineData.data);
        }
        if (content.turnComplete) {
          finalizeTranscripts();
          if (activeOutputCountRef.current === 0 && sessionReadyRef.current) {
            setPhase('listening');
            setStatusText('我在听。你可以继续说中文。');
          }
        }
      };
      socket.onerror = () => {
        if (!setupSettled) {
          setupSettled = true;
          if (setupTimeoutId !== null) window.clearTimeout(setupTimeoutId);
          setupTimeoutId = null;
          setupReject?.(new Error('Could not connect to Gemini Live. Check the Worker URL, allowed origin, model access and API key.'));
        } else if (!intentionalCloseRef.current) {
          setErrorText('The live connection encountered a network error. End the session and try again.');
        }
      };
      socket.onclose = (event) => {
        if (!setupSettled) {
          setupSettled = true;
          if (setupTimeoutId !== null) window.clearTimeout(setupTimeoutId);
          setupTimeoutId = null;
          const reason = event.reason ? `: ${event.reason}` : '';
          setupReject?.(new Error(`Gemini Live closed before setup completed (${event.code})${reason}.`));
        } else if (!intentionalCloseRef.current && socketRef.current === socket) {
          sessionReadyRef.current = false;
          streamRef.current?.getTracks().forEach((trackItem) => trackItem.stop());
          streamRef.current = null;
          if (processorRef.current) {
            processorRef.current.onaudioprocess = null;
            try { processorRef.current.disconnect(); } catch { /* Already disconnected. */ }
            processorRef.current = null;
          }
          try { micSourceRef.current?.disconnect(); } catch { /* Already disconnected. */ }
          micSourceRef.current = null;
          const context = audioContextRef.current;
          audioContextRef.current = null;
          if (context && context.state !== 'closed') void context.close();
          setErrorText(event.reason || 'The voice connection closed. You can start another session.');
          setSessionStartedAt(null);
          setPhase('error');
        }
      };

      await setupPromise;
      if (setupTimeoutId !== null) window.clearTimeout(setupTimeoutId);
      setupTimeoutId = null;
      if (socket.readyState !== WebSocket.OPEN) throw new Error('The Gemini Live socket closed during setup.');
      await setupAudioCapture(socket, stream, audioContext);
      sessionReadyRef.current = true;
      const now = Date.now();
      setSessionStartedAt(now);
      setPhase('listening');
      setStatusText('你好！我在听。请用中文和我聊聊。');
      // A short starter invitation helps the session feel conversational without giving an English answer.
      socket.send(JSON.stringify({ realtimeInput: { text: '请先用非常简单、自然的简体中文向学习者问好，然后提出一个适合当前程度、关于日常生活的问题。' } }));
      sessionTimeoutRef.current = window.setTimeout(() => { void stopConversation(true); }, maxSessionSeconds * 1000);
    } catch (error) {
      if (socket && socket.readyState < WebSocket.CLOSING) socket.close();
      socketRef.current = null;
      sessionReadyRef.current = false;
      streamRef.current?.getTracks().forEach((trackItem) => trackItem.stop());
      streamRef.current = null;
      const context = audioContextRef.current;
      audioContextRef.current = null;
      if (context && context.state !== 'closed') {
        try { await context.close(); } catch { /* No action needed. */ }
      }
      setPhase('error');
      setErrorText(errorMessage(error));
      setStatusText('暂时无法开始对话。');
    }
  }, [track, curriculumWords, privacyAccepted, maxSessionSeconds, cleanDrafts, stopOutputAudio, setupAudioCapture, schedulePcmAudio, finalizeTranscripts, stopConversation]);

  const sendTypedMessage = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = typedText.trim();
    const socket = socketRef.current;
    if (!value || !socket || socket.readyState !== WebSocket.OPEN || !sessionReadyRef.current) return;
    socket.send(JSON.stringify({ realtimeInput: { text: value } }));
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((current) => [...current, { id: `u-${Date.now()}`, role: 'user' as const, text: value, time }].slice(-40));
    setTypedText('');
    setPhase('thinking');
    setStatusText('我在想一想…');
  }, [typedText]);

  useEffect(() => () => {
    intentionalCloseRef.current = true;
    if (sessionTimeoutRef.current !== null) window.clearTimeout(sessionTimeoutRef.current);
    if (animationFrameRef.current !== null) window.cancelAnimationFrame(animationFrameRef.current);
    processorRef.current && (processorRef.current.onaudioprocess = null);
    streamRef.current?.getTracks().forEach((trackItem) => trackItem.stop());
    if (socketRef.current && socketRef.current.readyState < WebSocket.CLOSING) socketRef.current.close();
    for (const source of audioSourcesRef.current) { try { source.stop(); } catch { /* Already ended. */ } }
    const context = audioContextRef.current;
    if (context && context.state !== 'closed') void context.close();
  }, []);

  const connected = phase === 'listening' || phase === 'thinking' || phase === 'speaking';
  const busy = phase === 'connecting';
  const remaining = Math.max(0, maxSessionSeconds - elapsed);
  const displayMode: YukotoVoiceMode = phase === 'error' ? 'idle' : phase;

  return (
    <section className="yukoto-ai-page" aria-label="Yukoto Mandarin conversation">
      <section className="yukoto-ai-intro">
        <div className="yukoto-ai-kicker"><span /> REAL-TIME MANDARIN PRACTICE</div>
        <h1>和我说中文</h1>
        <p>Have a real conversation. Listen, speak, make a mistake, and try again — one small sentence at a time.</p>
      </section>

      <div className="yukoto-ai-layout">
        <section className="yukoto-ai-stage-card" aria-label="Voice conversation controls">
          <div className="yukoto-ai-stage-top">
            <div className="yukoto-ai-status"><span className={`yukoto-ai-status-dot is-${phase}`} />{phase === 'idle' ? 'READY' : phase === 'connecting' ? 'CONNECTING' : phase === 'listening' ? 'LISTENING' : phase === 'thinking' ? 'THINKING' : phase === 'speaking' ? 'SPEAKING' : 'NEEDS ATTENTION'}</div>
            <span className="yukoto-ai-session-label"><Wifi size={13} /> LIVE VOICE</span>
          </div>
          <YukotoVoiceCharacter mode={displayMode} level={audioLevel} />
          <p className="yukoto-ai-status-copy" aria-live="polite">{statusText}</p>
          {!connected && !busy && <label className="yukoto-ai-consent yukoto-ai-stage-consent"><input type="checkbox" checked={privacyAccepted} onChange={(event) => setPrivacyAccepted(event.target.checked)} /> I understand that my voice or typed messages will be sent to Google Gemini for this session.</label>}
          <div className="yukoto-ai-live-actions">
            {!connected && !busy && <button className="yukoto-ai-primary-button" onClick={() => void startConversation()} disabled={!privacyAccepted} title={!privacyAccepted ? 'Accept the privacy notice to continue' : undefined}><Mic size={18} /> 开始对话 <span>Start speaking</span></button>}
            {busy && <button className="yukoto-ai-primary-button" disabled><LoaderCircle size={18} className="yukoto-spin" /> 正在连接…</button>}
            {connected && <>
              <button className={`yukoto-ai-mic-button ${micMuted ? 'is-muted' : ''}`} onClick={() => setMicMuted((value) => !value)} aria-pressed={micMuted}><span className="yukoto-ai-mic-icon">{micMuted ? <MicOff size={17} /> : <Mic size={17} />}</span>{micMuted ? 'Unmute' : 'Mute mic'}</button>
              <button className="yukoto-ai-stop-button" onClick={() => void stopConversation()}><PhoneOff size={17} /> End conversation</button>
            </>}
          </div>
          {connected && <div className="yukoto-ai-session-clock"><Clock3 size={14} /> {timeLabel(elapsed)} elapsed <span>·</span> {timeLabel(remaining)} remaining</div>}
          {errorText && <div className="yukoto-ai-error" role="alert"><AlertCircle size={16} /><span>{errorText}</span></div>}
          {languageSlip && <div className="yukoto-ai-language-note" role="status">检测到非中文转写，已隐藏这段文字。生成式语音模型仍可能偶尔偏离语言规则。</div>}
        </section>

        <section className="yukoto-ai-conversation-card" aria-label="Conversation transcript">
          <div className="yukoto-ai-conversation-head">
            <div><span className="yukoto-ai-eyebrow">YOUR PRACTICE SESSION</span><h2>Conversation</h2></div>
            <button className="yukoto-ai-icon-button" onClick={() => { setMessages([]); cleanDrafts(); setLanguageSlip(false); }} aria-label="Clear session transcript" title="Clear transcript"><Trash2 size={16} /></button>
          </div>
          <label className="yukoto-ai-level-label" htmlFor="yukoto-ai-level">Practice level</label>
          <select id="yukoto-ai-level" className="yukoto-ai-level-select" value={track} onChange={(event) => setTrack(event.target.value as Track)} disabled={connected || busy}>
            {LEVELS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
          <p className="yukoto-ai-level-note">The selected level guides difficulty. The model does not receive Yukoto's full vocabulary database unless it is explicitly connected.</p>

          <div className={`yukoto-ai-transcript ${showTranscript ? '' : 'is-hidden'}`} aria-live="polite" aria-label="Conversation messages">
            {messages.length === 0 && !userDraft && !assistantDraft && <div className="yukoto-ai-empty-transcript"><span className="yukoto-ai-empty-glyph">语</span><strong>对话会显示在这里</strong><p>Start a session and speak naturally. Your transcript stays in this page and is not saved to an account.</p></div>}
            {messages.map((message) => <article key={message.id} className={`yukoto-ai-message is-${message.role}`}>
              <div className="yukoto-ai-message-meta"><span>{message.role === 'assistant' ? 'YUKOTO' : 'YOU'}</span><time>{message.time}</time>{message.role === 'assistant' && <Volume2 size={13} />}</div>
              <p>{message.text}</p>
            </article>)}
            {userDraft && <article className="yukoto-ai-message is-user is-draft"><div className="yukoto-ai-message-meta"><span>YOU · LISTENING</span></div><p>{userDraft}</p></article>}
            {assistantDraft && <article className="yukoto-ai-message is-assistant is-draft"><div className="yukoto-ai-message-meta"><span>YUKOTO · SPEAKING</span></div><p>{assistantDraft}</p></article>}
            <div id="yukoto-ai-transcript-end" />
          </div>
          <button type="button" className="yukoto-ai-transcript-toggle" onClick={() => setShowTranscript((value) => !value)}>{showTranscript ? 'Hide transcript' : 'Show transcript'}</button>
          <form className="yukoto-ai-text-fallback" onSubmit={sendTypedMessage}>
            <label htmlFor="yukoto-ai-text">Can’t speak right now? Type a message.</label>
            <div className="yukoto-ai-composer"><input id="yukoto-ai-text" value={typedText} onChange={(event) => setTypedText(event.target.value)} placeholder="可以用中文或英语输入…" disabled={!connected} /><button type="submit" disabled={!connected || !typedText.trim()} aria-label="Send message"><Send size={16} /></button></div>
          </form>
        </section>
      </div>

      <section className="yukoto-ai-privacy">
        <div className="yukoto-ai-privacy-icon"><ShieldCheck size={19} /></div>
        <div className="yukoto-ai-privacy-copy"><strong>Privacy before you speak</strong><p>Live audio and any typed messages are sent to Google Gemini to power this conversation. Yukoto does not save sessions to an account or database. Depending on the API tier, Google may use submitted content to improve its products; the current free tier may do so. Review <a href="https://ai.google.dev/gemini-api/docs/pricing" target="_blank" rel="noreferrer">Google's current API data terms</a> before using this service. Do not share passwords, financial details, or sensitive personal information.</p>
        </div>
      </section>
      <p className="yukoto-ai-footnote">Sessions are limited to {Math.round(maxSessionSeconds / 60)} minutes. Headphones help prevent the speaker from feeding back into the microphone. If the AI ever speaks English, use the feedback link on your site and review the model configuration before wider release.</p>
    </section>
  );
}
