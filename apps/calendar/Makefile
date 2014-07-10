# We can't figure out XULRUNNERSDK on our own; it's complex and some builders
# # may want to override our find logic (ex: TBPL), so let's just leave it up to
# # the root Makefile.  If you know what you're doing, you can manually define
# # XULRUNNERSDK and XPCSHELLSDK on the command line.
ifndef XPCSHELLSDK
$(error This Makefile needs to be run by the root gaia makefile. Use `make APP=email` from the root gaia directory.)
endif

-include $(PWD)/build/common.mk

.PHONY: all $(STAGE_APP_DIR)/js/built.js

all: $(STAGE_APP_DIR)/js/built.js
clean:
	rm -rf $(STAGE_APP_DIR)

$(STAGE_APP_DIR)/js/built.js:
	$(XULRUNNERSDK) $(XPCSHELLSDK) ../../build/r.js -o build.js
	@cp -R style/ $(STAGE_APP_DIR)/style
	@cp index.html $(STAGE_APP_DIR)/index.html
	@cp manifest.webapp $(STAGE_APP_DIR)/manifest.webapp
	@sed -i '' 's/.*data-main.*/<script defer src="js\/built.js"><\/script>/' $(STAGE_APP_DIR)/index.html
