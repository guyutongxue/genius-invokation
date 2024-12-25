namespace GiTcg;

public class CreateParam : ObjBase, IDisposable
{
  internal readonly IntPtr handle;
  private bool disposed = false;

  public CreateParam()
  {
    unsafe
    {
      gitcg_state_createparam* param;
      int ret = NativeMethods.gitcg_state_createparam_new(&param);
      if (ret != 0)
      {
        throw new Exception("Failed to create state create param");
      }
      handle = (IntPtr)param;
    }
  }
  public CreateParam(Deck deck0, Deck deck1) : this() {
    SetCharacters(0, deck0.Characters);
    SetCards(0, deck0.Cards);
    SetCharacters(1, deck1.Characters);
    SetCards(1, deck1.Cards);
  }

  public void SetCharacters(int who, int[] characters)
  {
    unsafe
    {
      fixed (int* characters_ptr = characters)
      {
        var ret = NativeMethods.gitcg_state_createparam_set_deck((gitcg_state_createparam*)handle, who, 1, characters_ptr, characters.Length);
        if (ret != 0)
        {
          throw new Exception("Failed to set characters");
        }
      }
    }
  }
  public void SetCards(int who, int[] cards) {
    unsafe
    {
      fixed (int* cards_ptr = cards)
      {
        var ret = NativeMethods.gitcg_state_createparam_set_deck((gitcg_state_createparam*)handle, who, 2, cards_ptr, cards.Length);
        if (ret != 0)
        {
          throw new Exception("Failed to set cards");
        }
      }
    }
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
        _ = NativeMethods.gitcg_state_createparam_free((gitcg_state_createparam*)handle);
      }
    }
    disposed = true;
  }
  ~CreateParam()
  {
    Dispose(disposing: false);
  }
}
