# install
- npm run build 
- npm link

# using
- agents config --api_key=<api-key> --model=gemini-2.0-flash
- agents generate <file> tool=<odata_test_generator-or-nestjs_test_generator>

# test
node --require esbuild-register src/cli.ts generate ./test/nestjs.service.ts

# gemini api key
- https://aistudio.google.com/app/apikey 
