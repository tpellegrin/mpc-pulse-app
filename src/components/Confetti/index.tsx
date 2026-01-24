import { useState, useEffect } from 'react';
import useWindowSize from 'react-use/lib/useWindowSize';
import ConfettiComponent from 'react-confetti';
import { styled } from 'styled-components';

const ConfettiWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  transition: opacity 2s ease-out;
  z-index: 9999;
`;

export const Confetti = ({ duration = 2000 }) => {
  const { width, height } = useWindowSize();
  const [isRunning, setIsRunning] = useState(true);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOpacity(0);
    }, duration);

    const fadeOutTimer = setTimeout(() => {
      setIsRunning(false);
    }, duration + 2000);

    return () => {
      clearTimeout(timer);
      clearTimeout(fadeOutTimer);
    };
  }, [duration]);

  return (
    <>
      {isRunning && (
        <ConfettiWrapper data-allow-fade style={{ opacity }}>
          <ConfettiComponent width={width} height={height} />
        </ConfettiWrapper>
      )}
    </>
  );
};
