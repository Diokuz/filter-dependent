pretty:
	yarn prettier --write ./src/*.ts

bench-write:
	node tools/write-extra-files.js

bench-cg:
	DEBUG=timings* node benchmark/collectGraph.js

bench-cgs:
	DEBUG=timings* node benchmark/collectGraphSync.js

clean:
	rm -r lib || true

prepare:
	make clean
	make pretty
	yarn tsc
	yarn jest
