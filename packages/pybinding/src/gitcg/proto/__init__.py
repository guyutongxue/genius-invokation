"""
@private
"""

def make_protobuf_work():
    """
    F**k you, Google
    See https://github.com/protocolbuffers/protobuf/issues/3430
    """
    import sys
    import os
    dirname = os.path.abspath(os.path.dirname(__file__))
    sys.path.append(dirname)

make_protobuf_work()

from .enums_pb2 import *
from .action_pb2 import *
from .mutation_pb2 import *
from .preview_pb2 import *
from .rpc_pb2 import *
from .notification_pb2 import *
