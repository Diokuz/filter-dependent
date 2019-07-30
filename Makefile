pretty:
	yarn prettier --write ./*.ts

bench-cg:
	DEBUG=pipi* node benchmark/collectGraph.js

bench-cgs:
	DEBUG=pipi* node benchmark/collectGraphSync.js
