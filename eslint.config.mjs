import reactHooks from 'eslint-plugin-react-hooks';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const unusedVariables = ['error', {
	argsIgnorePattern: '^_',
	caughtErrorsIgnorePattern: '^_',
	varsIgnorePattern: '^_',
}];

const unusedImportsRules = {
	'no-unused-vars': 'off',
	'@typescript-eslint/no-unused-vars': 'off',
	'unused-imports/no-unused-imports': 'error',
	'unused-imports/no-unused-vars': unusedVariables,
};

const obviousErrors = {
	'no-constant-binary-expression': 'error',
	'no-debugger': 'error',
	'no-dupe-keys': 'error',
	'no-unsafe-finally': 'error',
};

export default tseslint.config(
	{
		ignores: ['**/dist/**', '**/node_modules/**', '**/coverage/**'],
	},
	{
		files: ['frontend/src/**/*.{ts,tsx}'],
		languageOptions: {
			globals: globals.browser,
			parser: tseslint.parser,
		},
		plugins: {
			'react-hooks': reactHooks,
			'unused-imports': unusedImports,
		},
		rules: {
			...obviousErrors,
			...unusedImportsRules,
			'react-hooks/rules-of-hooks': 'error',
			'react-hooks/exhaustive-deps': 'error',
		},
	},
	{
		files: ['backend/src/**/*.ts'],
		languageOptions: {
			globals: { ...globals.node, ...globals.jest },
			parser: tseslint.parser,
		},
		plugins: {
			'unused-imports': unusedImports,
		},
		rules: {
			...obviousErrors,
			...unusedImportsRules,
		},
	},
);
