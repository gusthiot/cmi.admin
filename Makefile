# You wouldn't believe the time people waste trying to learn grunt,
# isobuild and all that jazz. And no, we don't care all that much
# about building on Windows.

.PHONY: clean

init:
	git submodule update --init

clean:
	rm .meteor/local/{build,bundler-cache,plugin-cache,isopacks}
