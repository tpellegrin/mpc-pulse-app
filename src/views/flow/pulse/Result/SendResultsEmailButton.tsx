import React from 'react';
import emailjs from '@emailjs/browser';
import { Button } from 'components/Button';
import { Flex } from 'components/Flex';
import { Text } from 'components/Text';
import { usePulse } from '../state/pulseContext';
import { t } from 'i18n';
import { Confetti } from '@components/Confetti';

// Temporary: embed EmailJS credentials in the frontend (overrideable via Vite env vars)
// These will be discarded later; env vars take precedence if defined at build time.
const SERVICE_ID =
  (import.meta.env.VITE_EMAILJS_SERVICE_ID as string | undefined) ??
  'service_jn3upcg';
const TEMPLATE_ID =
  (import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string | undefined) ??
  'template_3lsvyl5';
const PUBLIC_KEY =
  (import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string | undefined) ??
  'YFYrGdeeBxJKjCfgj';

function toHuman(v: number | null | undefined) {
  return typeof v === 'number' ? `${v + 1} / 5` : '—';
}

export const SendResultsEmailButton: React.FC = () => {
  const { state } = usePulse();
  const [sending, setSending] = React.useState(false);
  const [done, setDone] = React.useState<null | 'ok' | 'err'>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const answersLabeled = React.useMemo(() => {
    const entries: [string, string][] = [];
    const add = (tag: 'intro' | `q${number}`, key: keyof typeof state) => {
      const label = t(`pulse.${tag}.mainText` as any);
      const val = toHuman(state[key] as any);
      entries.push([label, val]);
    };
    add('intro', 'introMorphIndex');
    for (let n = 2 as const; n <= 19; n++) {
      add(`q${n}` as any, `q${n}Index` as keyof typeof state);
    }
    return entries;
  }, [state]);

  const send = async () => {
    if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
      setErrorMsg(
        'EmailJS não configurado. Defina VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID e VITE_EMAILJS_PUBLIC_KEY.',
      );
      setDone('err');
      return;
    }
    setSending(true);
    setDone(null);
    setErrorMsg(null);

    try {
      const subject = 'MPC Pulse – Resultados';
      const message = answersLabeled.map(([l, v]) => `${l}: ${v}`).join('\n');
      const answers_json = JSON.stringify(state);
      const sent_at = new Date().toISOString();
      const locale = navigator.language;
      const user_agent = navigator.userAgent;

      await emailjs.send(
        SERVICE_ID,
        TEMPLATE_ID,
        { subject, message, answers_json, sent_at, locale, user_agent },
        PUBLIC_KEY,
      );

      setDone('ok');
    } catch (e: any) {
      setErrorMsg(e?.message || 'Falha ao enviar');
      setDone('err');
    } finally {
      setSending(false);
    }
  };

  return (
    <Flex
      direction="column"
      gap="sm"
      width="100%"
      style={{ maxWidth: 'min(100vw, 720px)', marginInline: 'auto' }}
    >
      {done === 'ok' && <Confetti duration={10000} />}
      <Button
        onClick={send}
        variant="accent"
        size="medium"
        label={
          sending
            ? 'Enviando…'
            : done === 'ok'
              ? 'Enviado ✔️'
              : 'Enviar respostas'
        }
        disabled={sending || done === 'ok'}
      />
      {done === 'err' && <Text align="center">Erro ao enviar: {errorMsg}</Text>}
    </Flex>
  );
};
