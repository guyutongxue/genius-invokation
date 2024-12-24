namespace GiTcg;
using System.Runtime.InteropServices;
using System.Text;
using Google.Protobuf;

unsafe class Handlers(IPlayer player)
{
  [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
  delegate void NotificationHandler(void* data, byte* msg_ptr, nuint msg_len);

  [UnmanagedFunctionPointer(CallingConvention.Cdecl)]

  delegate void RpcHandler(void* data, byte* req_ptr, nuint req_len, byte* res_ptr, nuint* res_len);

  [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
  delegate void IoErrorHandler(void* data, byte* msg);

  public static readonly delegate* unmanaged[Cdecl]<void*, byte*, nuint, void> notification_handler = (delegate* unmanaged[Cdecl]<void*, byte*, nuint, void>)Marshal.GetFunctionPointerForDelegate((NotificationHandler)StaticOnNotification);
  public static readonly delegate* unmanaged[Cdecl]<void*, byte*, nuint, byte*, nuint*, void> rpc_handler = (delegate* unmanaged[Cdecl]<void*, byte*, nuint, byte*, nuint*, void>)Marshal.GetFunctionPointerForDelegate((RpcHandler)StaticOnRpc);
  public static readonly delegate* unmanaged[Cdecl]<void*, byte*, void> io_error_handler = (delegate* unmanaged[Cdecl]<void*, byte*, void>)Marshal.GetFunctionPointerForDelegate((IoErrorHandler)StaticOnIoError);

  static void StaticOnNotification(void* data, byte* msg_ptr, nuint msg_len)
  {
    var obj = (Handlers?)GCHandle.FromIntPtr((IntPtr)data).Target;
    obj?.OnNotification(msg_ptr, msg_len);
  }
  static void StaticOnRpc(void* data, byte* req_ptr, nuint req_len, byte* res_ptr, nuint* res_len)
  {
    var obj = (Handlers?)GCHandle.FromIntPtr((IntPtr)data).Target;
    obj?.OnRpc(req_ptr, req_len, res_ptr, res_len);
  }
  static void StaticOnIoError(void* data, byte* msg)
  {
    var obj = (Handlers?)GCHandle.FromIntPtr((IntPtr)data).Target;
    obj?.OnIoError(msg);
  }

  readonly IPlayer player = player;

  public void OnNotification(byte* msg_ptr, nuint msg_len)
  {
    var span = new Span<byte>(msg_ptr, (int)msg_len);
    var notification = Proto.Notification.Parser.ParseFrom(span);
    player.OnNotification(notification);
  }

  public void OnRpc(byte* req_ptr, nuint req_len, byte* res_ptr, nuint* res_len)
  {
    var req_span = new Span<byte>(req_ptr, (int)req_len);
    var request = Proto.Request.Parser.ParseFrom(req_span);
    var response = player.OnRpc(request);
    var res_bytes = response.ToByteArray();
    Marshal.Copy(res_bytes, 0, (IntPtr)res_ptr, res_bytes.Length);
    *res_len = (nuint)res_bytes.Length;
  }

  public void OnIoError(byte* msg)
  {
    var error_msg = Encoding.UTF8.GetString(MemoryMarshal.CreateReadOnlySpanFromNullTerminated(msg));
    player.OnIoError(error_msg);
  }
}


// TODO
public interface IPlayer
{
  void OnNotification(Proto.Notification notification);
  Proto.Response OnRpc(Proto.Request request);
  void OnIoError(string error_msg);
}

class Game
{
  IntPtr handle;
  readonly GCHandle?[] handlers_gc_handles = [null, null];

  public void SetPlayer(int who, IPlayer player)
  {
    var handlers = new Handlers(player);
    var gc_handle = GCHandle.Alloc(handlers, GCHandleType.Pinned);
    handlers_gc_handles[who]?.Free();
    handlers_gc_handles[who] = gc_handle;
    unsafe
    {
      var game = (gitcg_game*)handle;
      NativeMethods.gitcg_game_set_player_data(game, who, (void*)gc_handle.AddrOfPinnedObject());
      NativeMethods.gitcg_game_set_notification_handler(game, who, Handlers.notification_handler);
      NativeMethods.gitcg_game_set_rpc_handler(game, who, Handlers.rpc_handler);
      NativeMethods.gitcg_game_set_io_error_handler(game, who, Handlers.io_error_handler);
    }
  }

}
