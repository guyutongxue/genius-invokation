namespace GiTcg;

abstract public class ObjBase {
  static ObjBase() {
    NativeMethods.gitcg_initialize();
    var threadInit = new ThreadLocal<ValueTuple>(ThreadInit);
    _ = threadInit.Value;
  }

  public static ValueTuple ThreadInit() {
    NativeMethods.gitcg_thread_initialize();
    return ValueTuple.Create();
  }
  public static void ThreadCleanup() {
    NativeMethods.gitcg_thread_cleanup();
  }
}
