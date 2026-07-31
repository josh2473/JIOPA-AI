function checkFeatureTriggers(text) {
  const lower = text.toLowerCase();
  if (GALLERY_TRIGGERS.some(k => lower.includes(k))) {
    addMsg('jiopa', 'Opening the JIOPA photo gallery for you!');
    openGallery();
    return true;
  }
  for (const key in ANTHEM_TRIGGERS) {
    if (ANTHEM_TRIGGERS[key].some(k => lower.includes(k))) {
      singAnthem(key);
      return true;
    }
  }
  for (const video of TAKEOVER_TRIGGERS.videos) {
    if (video.keywords.some(k => lower.includes(k))) {
      addMsg('jiopa', `?? Playing "${video.label}" ? enjoy the show!`);
      playTakeoverVideo(video.src);
      return true;
    }
  }
  if (TAKEOVER_TRIGGERS.effect.keywords.some(k => lower.includes(k))) {
    addMsg('jiopa', '? Let\'s celebrate!');
    playTakeoverEffect();
    return true;
  }
  return false;
}
