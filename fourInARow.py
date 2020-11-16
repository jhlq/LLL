import numpy as np

class FIAR():
  def __init__(self):
    self.board=np.zeros((6,7))
    self.player=1
    self.winner=0
    self.done=False
    self.nmoves=0

  def place(self, loc):
    if self.done or self.board[0][loc]!=0:
      return False
    self.nmoves+=1
    for i in range(6):
      if self.board[5-i][loc]==0:
        self.board[5-i][loc]=self.player
        if self.checkIfWon((5-i,loc)):
            self.winner=self.player
            self.done=True
            return True
        for u in range(2):
          row=5-i-1+u
          if (row>5 or row<0):
            continue
         # print(self.nmoves,"co",(row,loc-1))
          
          
        self.player+=1
        if self.player>2:
          self.player=1
        return True

  def checkIfWon(self,co):
    p=1
    if self.board[co[0]][co[1]]!=self.player:
      print("Empty")
      return False
    for i in range(3):
      nco=co[0],co[1]+i+1
      if nco[1]<7 and self.board[nco[0]][nco[1]]==self.player:
        p+=1
      else:
        break
    for i in range(3):
      nco=co[0],co[1]-i-1
      if nco[1]>=0 and self.board[nco[0]][nco[1]]==self.player:
        p+=1
      else:
        break
    if p>3:
      return True
    p=1
    for i in range(3):
      nco=co[0]+i+1,co[1]+i+1
      if nco[0]<6 and nco[1]<7 and self.board[nco[0]][nco[1]]==self.player:
        p+=1
      else:
        break
    for i in range(3):
      nco=co[0]-i-1,co[1]-i-1
      if nco[0]>=0 and nco[1]>=0 and self.board[nco[0]][nco[1]]==self.player:
        p+=1
      else:
        break
    if p>3:
      return True
    p=1
    for i in range(3):
      nco=co[0]-i-1,co[1]+i+1
      if nco[0]>=0 and nco[1]<7 and self.board[nco[0]][nco[1]]==self.player:
        p+=1
      else:
        break
    for i in range(3):
      nco=co[0]+i+1,co[1]-i-1
      if nco[0]<6 and nco[1]>=0 and self.board[nco[0]][nco[1]]==self.player:
        p+=1
      else:
        break
    print("p",p)
    if p>3:
      return True
    p=1
    for i in range(3):
      nco=co[0]+i+1,co[1]
      if nco[0]<6 and self.board[nco[0]][nco[1]]==self.player:
        p+=1
      else:
        break
    for i in range(3):
      nco=co[0]-i-1,co[1]
      if nco[0]>=0 and self.board[nco[0]][nco[1]]==self.player:
        p+=1
      else:
        break
    #print("p",p)
    if p>3:
      return True
    return False
      
  def observe(self):
    obs=np.array([])
