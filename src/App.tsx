import { useRef, useState } from 'react';
import './App.css';
import { ButtonBase } from 'components/ButtonBase';
import { Flex } from 'components/Flex';
import { Box } from 'components/Box';

function App() {
  const [count, setCount] = useState(0);
  const btnRef = useRef<HTMLButtonElement | HTMLAnchorElement | null>(null);
  const [disabled, setDisabled] = useState(false);

  const demoBoxStyle: React.CSSProperties = {
    background: 'var(--surface-bg, #f3f3f3)',
    border: '1px solid rgba(0,0,0,0.1)',
    borderRadius: 6,
    padding: 12,
    minWidth: 80,
    minHeight: 48,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <Flex style={{ padding: 16, display: 'grid', gap: 24 }}>
      {/* Buttons (existing ButtonBase test) */}
      <Flex direction="row" gap="xs" alignItems="center">
        <ButtonBase href="https://vite.dev" target="_blank">
          <img src="/vite.svg" className="logo" alt="Vite logo" />
        </ButtonBase>

        <ButtonBase ref={btnRef} onClick={() => setCount((c) => c + 1)}>
          Increment
        </ButtonBase>

        <ButtonBase href="https://react.dev" disabled={disabled}>
          Disabled link
        </ButtonBase>

        <ButtonBase onClick={() => btnRef.current?.focus()}>
          Focus Increment
        </ButtonBase>
        <ButtonBase onClick={() => setDisabled((d) => !d)}>
          Toggle disabled (anchor)
        </ButtonBase>
      </Flex>

      <div>Count: {count}</div>

      {/* Flex demos */}
      <Flex direction="row" gap="md" width="100%">
        <h3>Flex: column (default)</h3>
        <Flex direction="row" gap="md" width="100%">
          <div style={demoBoxStyle}>A</div>
          <div style={demoBoxStyle}>B</div>
          <div style={demoBoxStyle}>C</div>
        </Flex>
      </Flex>

      <section>
        <h3>Flex: row with wrapping</h3>
        <Flex
          direction="row"
          gap="xs"
          desktopGap="md"
          flexWrap="wrap"
          alignItems="center"
          alignContent="stretch"
          justifyContent="flex-start"
          width="100%"
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ ...demoBoxStyle, minWidth: 120 }}>
              Item {i + 1}
            </div>
          ))}
        </Flex>
      </section>

      <section>
        <h3>Flex: center content</h3>
        <Flex
          direction="row"
          gap="xs"
          alignItems="center"
          justifyContent="center"
          style={{
            height: 120,
            background: 'rgba(125,125,125,0.06)',
            borderRadius: 8,
          }}
        >
          <div style={demoBoxStyle}>Left</div>
          <div style={demoBoxStyle}>Middle</div>
          <div style={demoBoxStyle}>Right</div>
        </Flex>
      </section>

      {/* --- Box demos (pure surface) --- */}
      <section>
        <h3>Box (pure surface)</h3>

        {/* Default surface with token paddings */}
        <Box elevation="sm">
          <Flex direction="row" gap="md" alignItems="center">
            <Flex style={demoBoxStyle}>Inside Box</Flex>
            <Flex style={demoBoxStyle}>Surface primary</Flex>
          </Flex>
        </Box>

        {/* Elevated surface */}
        <Box
          backgroundColor="base"
          borderColor="surface.base"
          elevation="sm"
          borderRadius="md"
          px="lg"
          py="md"
          style={{ marginTop: 16 }}
        >
          <Flex direction="row" gap="md" alignItems="center">
            <Flex style={demoBoxStyle}>Elevation sm</Flex>
            <Flex style={demoBoxStyle}>Rounded</Flex>
          </Flex>
        </Box>

        {/* Gradient surface (overrides backgroundColor) */}
        <Box
          gradient="card"
          color="primary"
          borderRadius="lg"
          px="md"
          py="lg"
          style={{ marginTop: 16 }}
        >
          <Flex direction="row" gap="md" alignItems="center">
            <Flex style={demoBoxStyle}>Gradient</Flex>
            <Flex style={demoBoxStyle}>Token text color</Flex>
          </Flex>
        </Box>
      </section>
    </Flex>
  );
}

export default App;
