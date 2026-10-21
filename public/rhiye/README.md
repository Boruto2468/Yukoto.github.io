# Rhiye card pools

Add cards to `data/zh.json` or `data/ja.json`. Keep the card's `id` unique in that language, use the existing `group`, `kind`, language and level values, and fill in its reading and meaning. Learn cards belong in `characters`, `idioms` or `phrases`; audio cards belong in `listen`. For optional recordings, set `audioUrl` to a site-hosted public asset path.

Rhiye HSK/JLPT levels are beginner-friendly recommendations for this feed, not claims that each expression is on an official syllabus list.

For a video, add an entry to `videos` with `kind` set to `life-video` or `screen-video`, a title in `text`, original `listenFor` details, the authorised channel in `source`, and the checked 11-character YouTube ID in `videoId`. For a full Short, set `embedVerified` and `segmentVerified` to `true`, set `startSeconds` to `0`, and omit `endSeconds`; the privacy-enhanced embed then plays the entire video. For a selected segment instead, provide its start and end times. A YouTube link is also shown in case embedding is unavailable. Never add a re-upload or an unverified ID.

Each language includes only the 18 user-supplied, user-confirmed authorized Shorts; there are no unused template video cards. The Shorts embed and play in full. Their displayed titles use the supplied descriptions; the accompanying original “listen for” notes are starter vocabulary prompts. The pools contain 75 learn/listen cards per language (150 total), and the 36 supplied Shorts meet the video-link target.

The lists in `nativeSpeakerReview` call out original content whose register or nuance should be checked by a native speaker.
