import React, { useState, useRef, useEffect } from "react";
import "./MusicPlayer.css";

const MusicPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const toggleMusic = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Optional: Automatically play music when component mounts (only if allowed)
  useEffect(() => {
    const audio = audioRef.current;

    const handleCanPlay = () => {
      if (isPlaying) {
        audio.play().catch((err) => {
          console.log("Autoplay blocked:", err);
        });
      }
    };

    audio.addEventListener("canplaythrough", handleCanPlay);

    return () => {
      audio.removeEventListener("canplaythrough", handleCanPlay);
    };
  }, [isPlaying]);

  return (
    <>
      <audio ref={audioRef} loop>
        <source src="1.mp3" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>

      <div className="music-toggle-button" onClick={toggleMusic}>
        {isPlaying ? "🎵" : "⏸️"}
      </div>
    </>
  );
};

export default MusicPlayer;
