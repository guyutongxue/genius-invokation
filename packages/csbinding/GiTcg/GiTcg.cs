namespace GiTcg;

using System.Text;
using System.Runtime.InteropServices;

public class GiTcg
{
  public static string Version()
  {
    string result;
    unsafe
    {
      var span = MemoryMarshal.CreateReadOnlySpanFromNullTerminated(NativeMethods.gitcg_version());
      result = Encoding.UTF8.GetString(span);
    }
    return result;
  }

  public static void Test() {
    var action = new Proto.Action();
  }
}
