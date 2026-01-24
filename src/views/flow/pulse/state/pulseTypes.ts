export type PulseState = {
  introMorphIndex: number | null;
  q2Index: number | null;
  q3Index: number | null;
  q4Index: number | null;
  q5Index: number | null;
  q6Index: number | null;
  q7Index: number | null;
  q8Index: number | null;
  q9Index: number | null;
  q10Index: number | null;
  q11Index: number | null;
  q12Index: number | null;
  q13Index: number | null;
  q14Index: number | null;
  q15Index: number | null;
  q16Index: number | null;
  q17Index: number | null;
  q18Index: number | null;
  q19Index: number | null;
};

export const createInitialPulseState = (): PulseState => ({
  introMorphIndex: null,
  q2Index: null,
  q3Index: null,
  q4Index: null,
  q5Index: null,
  q6Index: null,
  q7Index: null,
  q8Index: null,
  q9Index: null,
  q10Index: null,
  q11Index: null,
  q12Index: null,
  q13Index: null,
  q14Index: null,
  q15Index: null,
  q16Index: null,
  q17Index: null,
  q18Index: null,
  q19Index: null,
});
