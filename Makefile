pretty:
	yarn prettier --write ./*.ts

bench-cg:
	DEBUG=pipi* node benchmark/collectGraph.js

bench-cgs:
	DEBUG=pipi* node benchmark/collectGraphSync.js

clean:
	rm index.js || true
	rm index.d.ts || true
	rm graph.js || true
	rm graph.d.ts || true

prepare:
	make clean
	make pretty
	yarn tsc
	yarn jest
