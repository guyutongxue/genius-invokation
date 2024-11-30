
from . import low_level as ll
from contextlib import contextmanager
import threading

ll.initialize()
if threading.current_thread() is threading.main_thread():
    ll.thread_initialize()

def thread_initialize():
    ll.thread_initialize()

def thread_cleanup():
    ll.thread_cleanup()
