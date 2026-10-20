import { describe, expect, it } from 'vitest';
import { embedUrl, isYouTubeLink, openInMusicUrl, parseYouTube } from '../../src/lib/youtube';
import { nextTrack, playQueue, prevTrack, stopPlayer } from '../../src/lib/player';

describe('enlaces de YouTube / YouTube Music', () => {
  it('reconoce los formatos habituales', () => {
    expect(parseYouTube('https://music.youtube.com/watch?v=dQw4w9WgXcQ&si=abc')).toEqual({ videoId: 'dQw4w9WgXcQ', listId: null });
    expect(parseYouTube('https://youtu.be/dQw4w9WgXcQ?si=x')?.videoId).toBe('dQw4w9WgXcQ');
    expect(parseYouTube('youtube.com/shorts/dQw4w9WgXcQ')?.videoId).toBe('dQw4w9WgXcQ');
    expect(parseYouTube('https://music.youtube.com/playlist?list=OLAK5uy_abcdefghijk')).toEqual({ videoId: null, listId: 'OLAK5uy_abcdefghijk' });
  });
  it('rechaza enlaces que no son de YouTube', () => {
    expect(isYouTubeLink('https://open.spotify.com/track/123')).toBe(false);
    expect(isYouTubeLink('hola')).toBe(false);
    expect(isYouTubeLink('https://evil.com/watch?v=dQw4w9WgXcQ')).toBe(false);
    expect(isYouTubeLink('https://www.youtube.com/watch?v=<script>')).toBe(false);
  });
  it('genera la URL del reproductor y la de YouTube Music', () => {
    expect(embedUrl({ videoId: 'dQw4w9WgXcQ', listId: null })).toMatch(/^https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ\?/);
    expect(embedUrl({ videoId: null, listId: 'OLAK5uy_abcdefghijk' })).toContain('videoseries?');
    expect(openInMusicUrl({ videoId: 'dQw4w9WgXcQ', listId: null })).toBe('https://music.youtube.com/watch?v=dQw4w9WgXcQ');
  });
  it('cola de reproducción: siguiente, anterior y fin', async () => {
    const { usePlayer } = await import('../../src/lib/player');
    expect(typeof usePlayer).toBe('function');
    const t = (id: string) => ({ id, title: id, subtitle: '', link: 'https://youtu.be/dQw4w9WgXcQ' });
    playQueue([t('a'), t('b')], 0);
    nextTrack();
    prevTrack();
    nextTrack();
    nextTrack(); // fin de la cola
    stopPlayer();
  });
});
