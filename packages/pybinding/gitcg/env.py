
from . import low_level as ll
from contextlib import contextmanager
import threading

ll.initialize()
if threading.current_thread() is threading.main_thread():
    ll.thread_initialize()

def thread_initialize():
    """
    If running gitcg in a non-main thread, call this function to initialize the thread.
    """
    ll.thread_initialize()

def thread_cleanup():
    """
    If running gitcg in a non-main thread, call this function to clean up the thread.
    """
    ll.thread_cleanup()
