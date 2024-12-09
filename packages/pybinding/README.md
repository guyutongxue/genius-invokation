# Genius Invokation TCG (Python binding)

This Python binding of GI-TCG is based on the C Binding and Python `ctypes` FFI.

A very simple usage example:

```py
from gitcg import Deck, Player, Game

# Set players initial deck
DECK0 = Deck(characters=[1411, 1510, 2103], cards=[214111, 311503, ...])
DECK1 = Deck(characters=[1609, 2203, 1608], cards=[312025, 321002, ...])

class MyPlayer(Player):
    # implements on_notify, on_action, etc.
    # See `gitcg.Player`'s documentation for detail.
    pass

# Initialize the game
game = Game(create_param=CreateParam(deck0=DECK0, deck1=DECK1))
game.set_player(0, MyPlayer())
game.set_player(1, MyPlayer())

# Start and step the game until end
game.start()
while game.is_running():
    game.step()
```

Here is [a generated API documentation](https://pybinding.gi-tcg.guyutongxue.site).
