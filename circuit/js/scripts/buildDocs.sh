./node_modules/.bin/dts-bundle-generator ./dist/subquery/index.d.ts -o my.d.ts --external-inlines @axiom-crypto/tools @axiom-crypto/halo2-lib-js 
node ./scripts/convertDTs.js
rm my.d.ts
echo "Done"
