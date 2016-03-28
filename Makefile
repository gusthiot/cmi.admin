# You wouldn't believe the time people waste trying to learn grunt,
# isobuild and all that jazz. And no, we don't care all that much
# about building on Windows.

.PHONY: clean npmclean semanticclean

clean: npmclean semanticclean	
	rm .meteor/local/{build,bundler-cache,plugin-cache,isopacks}

npmclean:
	rm -rf packages/npm-container
	meteor remove npm-container || true
	meteor update meteorhacks:npm
# Need to re-run npm afterwards

semanticclean:
	rm -rf \
	  semantic/client/*.less semantic/client/.custom.semantic.json \
	  semantic/client/{definitions,themes,site}
