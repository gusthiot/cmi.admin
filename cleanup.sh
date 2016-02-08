#!/bin/bash

# You wouldn't believe the time people waste trying to learn grunt,
# isobuild and all that jazz. And no, we don't care all that much
# about building on Windows.
rm -rf .meteor/local/{build,bundler-cache,plugin-cache}/ \
  semantic/client/*.less semantic/client/.custom.semantic.json \
  semantic/client/{definitions,themes,site}

