import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, RotateCcw } from 'lucide-react';

export default function DialogPanel({ 
  characterName, 
  avatarSrc, 
  dialogText, 
  audioSrc, 
  followupAudioSrc,
  typingSpeed = 50,
  showAvatar = true,
  onComplete 
}) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const followupAudioRef = useRef(null);
  const activeAudioRef = useRef(null);
  const typingIntervalRef = useRef(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const startTypewriter = () => {
    if (!dialogText) {
      setDisplayedText('');
      setIsTyping(false);
      return;
    }

    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);

    setDisplayedText(dialogText.charAt(0));
    setIsTyping(true);

    if (dialogText.length === 1) {
      setIsTyping(false);
      if (onCompleteRef.current) onCompleteRef.current();
      return;
    }

    let currentIndex = 1;
    typingIntervalRef.current = setInterval(() => {
      if (currentIndex < dialogText.length) {
        setDisplayedText(dialogText.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
        setIsTyping(false);
        if (onCompleteRef.current) onCompleteRef.current();
      }
    }, typingSpeed);
  };

  const stopAllAudio = () => {
    if (audioRef.current) audioRef.current.pause();
    if (followupAudioRef.current) followupAudioRef.current.pause();
    activeAudioRef.current = null;
    setIsPlaying(false);
  };

  const playPrimaryAudio = () => {
    if (!audioRef.current || !audioSrc) return Promise.resolve(false);
    audioRef.current.currentTime = 0;
    audioRef.current.volume = 0.5;
    return audioRef.current.play()
      .then(() => {
        activeAudioRef.current = audioRef.current;
        setIsPlaying(true);
        return true;
      })
      .catch((e) => {
        console.log('Primary audio autoplay blocked', e);
        setIsPlaying(false);
        return false;
      });
  };

  const playFollowupAudio = () => {
    if (!followupAudioRef.current || !followupAudioSrc) {
      setIsPlaying(false);
      return Promise.resolve(false);
    }
    followupAudioRef.current.currentTime = 0;
    followupAudioRef.current.volume = 0.7;
    return followupAudioRef.current.play()
      .then(() => {
        activeAudioRef.current = followupAudioRef.current;
        setIsPlaying(true);
        return true;
      })
      .catch((e) => {
        console.log('Followup audio autoplay blocked', e);
        setIsPlaying(false);
        return false;
      });
  };

  const playAudioSequence = () => {
    stopAllAudio();
    if (audioSrc) {
      playPrimaryAudio();
      return;
    }
    if (followupAudioSrc) {
      playFollowupAudio();
    }
  };

  // Typewriter effect
  useEffect(() => {
    startTypewriter();
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
    };
  }, [dialogText, typingSpeed]);

  // Play original voice first, then intro line.
  useEffect(() => {
    if (audioSrc || followupAudioSrc) {
      playAudioSequence();
    }

    return () => {
      stopAllAudio();
    };
  }, [audioSrc, followupAudioSrc]);

  const toggleAudio = () => {
    if (!audioSrc && !followupAudioSrc) return;

    if (isPlaying) {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
      } else {
        stopAllAudio();
      }
      setIsPlaying(false);
    } else {
      if (activeAudioRef.current) {
        activeAudioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {
          setIsPlaying(false);
        });
      } else {
        playAudioSequence();
      }
    }
  };

  const replayDialog = () => {
    playAudioSequence();
    startTypewriter();
  };

  return (
    <div className="w-full max-w-sm mx-auto p-4 animate-in slide-in-from-bottom duration-500">
      <div className={`relative bg-[#151A30]/90 rounded-3xl p-5 border-4 border-[#7C5CFC] shadow-[0_10px_0_#4338CA] ${showAvatar ? 'pt-8 mt-12' : 'pt-4 mt-4'}`}>
        {/* Character Avatar */}
        {showAvatar ? (
          <div className="absolute -top-14 left-1/2 transform -translate-x-1/2">
            <div className="w-24 h-24 rounded-full border-4 border-[#7C5CFC] bg-[#0D0F1A] overflow-hidden shadow-lg shadow-purple-900/50 flex items-center justify-center">
              {avatarSrc ? (
                <img src={avatarSrc} alt={characterName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl text-gray-500">?</span>
              )}
            </div>
            {/* Character Name Tag */}
            <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-[#FBBF24] text-[#0D0F1A] px-4 py-1 rounded-full text-sm font-bold shadow-md whitespace-nowrap">
              {characterName}
            </div>
          </div>
        ) : (
          <div className="inline-flex items-center bg-[#FBBF24] text-[#1B1140] px-4 py-1.5 rounded-full text-sm font-bold shadow-md mb-3">
            {characterName}
          </div>
        )}

        {/* Audio Controls */}
        <div className="absolute top-3 right-3 flex gap-2">
          {(audioSrc || followupAudioSrc) && (
            <>
              <audio 
                ref={audioRef} 
                src={audioSrc} 
                onPlay={() => {
                  activeAudioRef.current = audioRef.current;
                  setIsPlaying(true);
                }}
                onEnded={() => {
                  if (followupAudioSrc) {
                    playFollowupAudio();
                  } else {
                    activeAudioRef.current = null;
                    setIsPlaying(false);
                  }
                }} 
                className="hidden"
              />
              <audio
                ref={followupAudioRef}
                src={followupAudioSrc}
                onPlay={() => {
                  activeAudioRef.current = followupAudioRef.current;
                  setIsPlaying(true);
                }}
                onEnded={() => {
                  activeAudioRef.current = null;
                  setIsPlaying(false);
                }}
                className="hidden"
              />
              <button
                onClick={toggleAudio}
                className="p-1.5 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Toggle audio"
              >
                {isPlaying ? <Volume2 size={16} className="text-[#FBBF24]" /> : <VolumeX size={16} className="text-gray-400" />}
              </button>
              <button 
                onClick={replayDialog}
                className="p-1.5 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Replay"
              >
                <RotateCcw size={16} className="text-[#7C5CFC]" />
              </button>
            </>
          )}
        </div>

        {/* Dialog Text */}
        <div className="mt-4 min-h-[80px]">
          <p className="text-lg leading-relaxed text-white">
            {displayedText}
            {isTyping && <span className="inline-block w-2 h-5 ml-1 bg-[#FBBF24] animate-pulse align-middle"></span>}
          </p>
        </div>
      </div>
    </div>
  );
}
