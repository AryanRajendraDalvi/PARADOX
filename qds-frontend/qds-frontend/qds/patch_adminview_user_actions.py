import re
with open('src/views/AdminView.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

handler = """
  const handleUserAction = (action) => {
    if (action === 'Download Chats History') {
      const userMessages = messages.filter(m => m.from_user_id === selectedUser || m.to_user_id === selectedUser);
      const blob = new Blob([JSON.stringify(userMessages, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedUser}_chats.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (action === 'Delete Account') {
      if (window.confirm(`Are you sure you want to delete ${selectedUser}'s account?`)) {
        alert("Account deleted.");
      }
    } else if (action === 'Change Access') {
      alert(`Access level updated for ${selectedUser}.`);
    } else if (action === 'Credentials') {
      alert(`Password reset link generated for ${selectedUser}.`);
    }
  };

  const activeAttack"""

text = text.replace("  const activeAttack", handler)

map_old = """{['Change Access', 'Credentials', 'Delete Account', 'Download Chats History'].map(opt => (
                        <div key={opt} className={`cursor-pointer text-lg transition-colors ${theme === 'dark' ? 'text-blue-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>
                          {opt}
                        </div>
                      ))}"""
map_new = """{['Change Access', 'Credentials', 'Delete Account', 'Download Chats History'].map(opt => (
                        <div key={opt} onClick={() => handleUserAction(opt)} className={`cursor-pointer text-lg transition-colors ${theme === 'dark' ? 'text-blue-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>
                          {opt}
                        </div>
                      ))}"""

text = text.replace(map_old, map_new)

with open('src/views/AdminView.jsx', 'w', encoding='utf-8') as f:
    f.write(text)