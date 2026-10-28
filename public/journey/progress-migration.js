/** Reconcile saved OpenJLPT IDs after a corpus update. Do not discard learner recall.
 * A prior v3.0 build may have recorded the imported ID for an existing Yukoto
 * word, rather than the stable original word ID. Migration only touches known
 * imported IDs with a corresponding current canonical ID.
 */
export function migrateImportedWordIds(languageProgress, importedWords, currentWords){
 if(!languageProgress?.words||!Array.isArray(importedWords)||!Array.isArray(currentWords))return false;
 const canonical=new Map(currentWords.map(w=>[w.native,w.id]));
 let changed=false;
 for(const source of importedWords){
  const targetId=canonical.get(source.native);
  if(!targetId||targetId===source.id||!languageProgress.words[source.id])continue;
  const previous=languageProgress.words[source.id];
  const existing=languageProgress.words[targetId];
  if(existing){
   const combined={...previous,...existing};
   for(const field of ['seen','practice','attempts','correct'])
    combined[field]=(Number(previous[field])||0)+(Number(existing[field])||0);
   combined.marked=Boolean(previous.marked||existing.marked);
   const due=[previous.due,existing.due].filter(Boolean).sort();
   if(due.length)combined.due=due[0];
   combined.native=existing.native||previous.native||source.native;
   languageProgress.words[targetId]=combined;
  }else{
   languageProgress.words[targetId]={...previous,native:previous.native||source.native};
  }
  delete languageProgress.words[source.id];
  changed=true;
 }
 return changed;
}
