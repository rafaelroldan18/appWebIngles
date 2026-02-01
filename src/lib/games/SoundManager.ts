import * as Phaser from 'phaser';

/**
 * SoundManager - Clase de utilidad para gestionar la reproducción de audio
 * y el volumen de forma centralizada.
 */
export class SoundManager {
    private scene: Phaser.Scene;
    private bgMusic: Phaser.Sound.BaseSound | null = null;
    private musicVolume: number = 0.3;
    private sfxVolume: number = 0.6;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    /**
     * Reproduce un efecto de sonido
     */
    playSfx(key: string, volume: number = 1.0) {
        try {
            if (this.scene.cache.audio.exists(key)) {
                // Multiplicamos por sfxVolume para control global
                this.scene.sound.play(key, { volume: volume * this.sfxVolume });
            } else {
                console.warn(`[SoundManager] SFX no encontrado en el caché: ${key}`);
            }
        } catch (e) {
            console.error(`[SoundManager] Error al reproducir SFX ${key}:`, e);
        }
    }

    /**
     * Inicia la música de fondo
     */
    playMusic(key: string = 'bg_music', volume: number = -1) {
        if (this.bgMusic) {
            this.bgMusic.stop();
        }

        const finalVolume = volume >= 0 ? volume : this.musicVolume;
        if (volume >= 0) this.musicVolume = volume;

        try {
            this.bgMusic = this.scene.sound.add(key, { loop: true, volume: finalVolume });
            this.bgMusic.play();
        } catch (e) {
            console.error(`[SoundManager] Error al iniciar música ${key}:`, e);
        }
    }

    /**
     * Detiene la música de fondo
     */
    stopMusic() {
        if (this.bgMusic) {
            this.bgMusic.stop();
        }
    }

    /**
     * Cambia el volumen maestro de la música
     */
    setMusicVolume(volume: number) {
        this.musicVolume = Phaser.Math.Clamp(volume, 0, 1);
        if (this.bgMusic) {
            if ('volume' in this.bgMusic) {
                (this.bgMusic as any).volume = this.musicVolume;
            }
        }
    }

    /**
     * Cambia el volumen maestro de los SFX
     */
    setSfxVolume(volume: number) {
        this.sfxVolume = Phaser.Math.Clamp(volume, 0, 1);
    }

    getMusicVolume(): number { return this.musicVolume; }
    getSfxVolume(): number { return this.sfxVolume; }

    /**
     * Alterna el estado de silencio global
     */
    toggleMute(): boolean {
        this.scene.sound.mute = !this.scene.sound.mute;
        return this.scene.sound.mute;
    }

    /**
     * Obtiene el estado actual de silencio
     */
    isMuted(): boolean {
        return this.scene.sound.mute;
    }
}
