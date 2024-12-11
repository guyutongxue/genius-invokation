from hatchling.builders.hooks.plugin.interface import BuildHookInterface
import os

class CustomBuildHook(BuildHookInterface):
    def initialize(self, version, build_data):
        build_data['tag'] = "py3-none-" + os.environ.get("PLATFORM_TAG", "any")
