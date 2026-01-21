module.exports = {
  extends: ['stylelint-config-standard', 'stylelint-a11y/recommended'],
  customSyntax: 'postcss-styled-syntax',
  plugins: [
    'stylelint-a11y',
    'stylelint-order',
    'stylelint-config-rational-order/plugin',
    'stylelint-use-logical',
  ],
  rules: {
    'order/properties-order': [],
    'plugin/rational-order': [
      true,
      {
        'border-in-box-model': false,
        'empty-line-between-groups': false,
      },
    ],
    'csstools/use-logical': true,
    // Disable false positives for runtime-provided CSS variables in CSS-in-JS
    // We define --route-transition-duration in :root and in Stage, and override inline.
    // The csstools rule can't always resolve these across files/parsers.
    'csstools/value-no-unknown-custom-properties': null,
    'unit-disallowed-list': [
      ['px'],
      {
        ignoreProperties: {
          px: ['/^border/', 'box-shadow', 'clip', 'background'],
        },
        severity: 'warning',
      },
    ],
    'no-duplicate-selectors': null,
    'function-no-unknown': null,
    'no-descending-specificity': null,
    'no-empty-source': null,
    'length-zero-no-unit': true,
    'selector-class-pattern': null,
  },
};
