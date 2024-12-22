using System.Runtime.InteropServices;
using System.Text;

namespace GiTcg;

public class State : ObjBase, IDisposable
{
  internal readonly IntPtr handle;
  private bool disposed = false;
  internal State(IntPtr handle)
  {
    this.handle = handle;
  }
  public State(CreateParam param)
  {
    unsafe
    {
      gitcg_state* state;
      var ret = NativeMethods.gitcg_state_new((gitcg_state_createparam*)param.handle, &state);
      if (ret != 0)
      {
        throw new Exception("Failed to create state");
      }
      handle = (IntPtr)state;
    }
  }

  public static State FromJson(string json)
  {
    unsafe
    {
      gitcg_state* state;
      fixed (byte* bytes_ptr = Encoding.UTF8.GetBytes(json + "\0"))
      {
        var ret = NativeMethods.gitcg_state_from_json(bytes_ptr, &state);
        if (ret != 0)
        {
          throw new Exception("Failed to create state from JSON");
        }
      }
      return new State((IntPtr)state);
    }
  }

  public string ToJson()
  {
    unsafe
    {
      byte* json;
      var ret = NativeMethods.gitcg_state_to_json((gitcg_state*)handle, &json);
      if (ret != 0)
      {
        throw new Exception("Failed to convert state to JSON");
      }
      string result = Encoding.UTF8.GetString(MemoryMarshal.CreateReadOnlySpanFromNullTerminated(json));
      NativeMethods.gitcg_free_buffer(json);
      return result;
    }
  }

  public override string ToString()
  {
    return ToJson();
  }

  public void Dispose()
  {
    Dispose(disposing: true);
    GC.SuppressFinalize(this);
  }
  private void Dispose(bool disposing)
  {
    if (!disposed)
    {
      if (disposing)
      {
        // dispose managed resources here
      }
      unsafe
      {
        int ret = NativeMethods.gitcg_state_free((gitcg_state*)handle);
      }
    }
    disposed = true;
  }
  ~State()
  {
    Dispose(disposing: false);
  }
}
