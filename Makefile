pretty:
	yarn prettier --write ./*.ts

bench-write:
	node tools/write-extra-files.js

bench-cg:
	DEBUG=timings* node benchmark/collectGraph.js

bench-cgs:
	DEBUG=timings* node benchmark/collectGraphSync.js

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
