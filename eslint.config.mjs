import { defineConfig, globalIgnores } from 'eslint/config'

const eslintConfig = defineConfig([globalIgnores(['build/**'])])

export default eslintConfig
