# install
- npm link

# using
- agents config --api_key=<api-key> --model=gemini-2.0-flash
- agents generate <file>

# test
node --require esbuild-register src/cli.ts generate ./test/nestjs.service.ts