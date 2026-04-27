/* ===================================================
   SCRIPT.JS — The brain of the Homework Chatbot

   What this file does:
   1. Listens for the user pressing Enter or clicking Send
   2. Decides how to respond (based on keywords)
   3. Adds/reads/clears homework from localStorage
   4. Creates and inserts chat bubbles into the page

   KEY CONCEPT — localStorage:
   localStorage is like a small notebook built into
   the browser. Data stays there even after you close
   the tab. We store homework as a JSON string.
=================================================== */


/* ── STEP 1: GRAB HTML ELEMENTS ──────────────────
   We need references to the HTML elements we'll use.
   document.getElementById('id') finds an element by its id. */
const messagesArea = document.getElementById('messages');
const userInput    = document.getElementById('userInput');


/* ── STEP 2: LOAD HOMEWORK FROM STORAGE ──────────
   When the page first loads, read any saved homework.
   
   localStorage only stores strings, so we convert
   the array ↔ string using JSON.stringify / JSON.parse. */
let homeworkList = JSON.parse(localStorage.getItem('homeworkList')) || [];
// If nothing is saved yet, start with an empty array: []


/* ── STEP 3: BOT RESPONSES MAP ───────────────────
   A simple object that maps keywords to bot replies.
   We'll search the user's message for these keywords. */
const responses = {
  // Greetings
  hello    : ["Hey! 👋 I'm Study Buddy. Ask me about your homework or just say hi!"],
  hi       : ["Hi there! 😊 Need help with homework?"],
  hey      : ["Hey! What's up? I'm here to help with your homework 📚"],

  // How are you
  "how are": ["I'm great, thanks! Ready to help you study 💪"],

  // Help
  help     : [
    "Here's what I can do:\n• Add homework → 'Add math homework: page 32'\n• See homework → 'What is my homework?'\n• Clear all → 'Clear homework'\n• Just chat too! 😊"
  ],

  // Thanks
  thanks   : ["You're welcome! 🙌 Keep up the good work!"],
  thank    : ["Happy to help! 📖"],

  // Bye
  bye      : ["Goodbye! Good luck studying! 👋"],
  goodbye  : ["See ya! Don't forget to do your homework! 📚"],

  // Motivation
  tired    : ["Take a short break — 10 minutes can really help! ⏱️ Then back to it!"],
  hard     : ["It's tough, but you've got this! Break it into small steps 💪"],
  boring   : ["I know studying can feel boring 😅 Try the Pomodoro method: 25 min study, 5 min break!"],
  stress   : ["Breathe! 🌬️ One thing at a time. You can do this!"],

  // Fun
  joke     : [
    "Why did the math book look so sad? Because it had too many problems! 😂",
    "Why was the student's report card wet? Because it was below C level! 🌊😄",
    "What do you call a fish without eyes? A fsh! 🐟😂"
  ],
};


/* ── STEP 4: HELPER — Get current time as "HH:MM" ─ */
function getTime() {
  const now = new Date();
  // padStart(2, '0') makes sure we get "09:05" not "9:5"
  return now.getHours().toString().padStart(2, '0') + ':' +
         now.getMinutes().toString().padStart(2, '0');
}


/* ── STEP 5: ADD A BUBBLE TO THE SCREEN ──────────
   This function creates a chat bubble div and puts
   it inside the messages area.
   
   sender = 'user' or 'bot'
   content = the text OR an HTML element to show */
function addBubble(sender, content) {
  // Create the outer row div
  const row = document.createElement('div');
  row.className = sender === 'user' ? 'user-row' : 'bot-row';

  // Create the inner bubble div
  const bubble = document.createElement('div');
  bubble.className = 'bubble ' + (sender === 'user' ? 'user-bubble' : 'bot-bubble');

  // If content is a string, set text. If it's an HTML element, append it.
  if (typeof content === 'string') {
    // Replace \n with <br> so line breaks show up in HTML
    bubble.innerHTML = content.replace(/\n/g, '<br>');
  } else {
    bubble.appendChild(content);   // for homework card
  }

  // Add timestamp
  const ts = document.createElement('div');
  ts.className = 'timestamp';
  ts.textContent = getTime();
  row.appendChild(bubble);
  row.appendChild(ts);

  // Put the row into the messages area
  messagesArea.appendChild(row);

  // Scroll to the bottom so new messages are visible
  messagesArea.scrollTop = messagesArea.scrollHeight;
}


/* ── STEP 6: SHOW TYPING INDICATOR ───────────────
   Shows three bouncing dots, like iMessage "typing..." */
function showTyping() {
  const row = document.createElement('div');
  row.className = 'bot-row';
  row.id = 'typing-indicator';   // id so we can find and remove it

  const bubble = document.createElement('div');
  bubble.className = 'bubble bot-bubble typing-dots';
  bubble.innerHTML = '<span></span><span></span><span></span>';

  row.appendChild(bubble);
  messagesArea.appendChild(row);
  messagesArea.scrollTop = messagesArea.scrollHeight;
}

/* Removes the typing indicator */
function removeTyping() {
  const el = document.getElementById('typing-indicator');
  if (el) el.remove();
}


/* ── STEP 7: SAVE HOMEWORK ────────────────────────
   Converts the array to a string and saves it.
   We call this every time homework changes. */
function saveHomework() {
  localStorage.setItem('homeworkList', JSON.stringify(homeworkList));
}


/* ── STEP 8: BUILD HOMEWORK CARD ─────────────────
   Creates a styled card element listing all homework.
   Returns an HTML element (not a string). */
function buildHomeworkCard() {
  const card = document.createElement('div');
  card.className = 'hw-card';

  const title = document.createElement('div');
  title.className = 'hw-card-title';
  title.textContent = '📋 Your Homework';
  card.appendChild(title);

  if (homeworkList.length === 0) {
    // No homework message
    const empty = document.createElement('div');
    empty.className = 'hw-empty';
    empty.textContent = '🎉 No homework! Enjoy your day!';
    card.appendChild(empty);
  } else {
    // Loop through each homework item and create a row
    homeworkList.forEach(function(item) {
      const row = document.createElement('div');
      row.className = 'hw-item';

      // Subject tag pill (e.g., "MATH")
      const tag = document.createElement('span');
      tag.className = 'subject-tag';
      tag.textContent = item.subject.toUpperCase();

      // The homework description
      const desc = document.createElement('span');
      desc.textContent = item.task;

      row.appendChild(tag);
      row.appendChild(desc);
      card.appendChild(row);
    });
  }

  return card;
}


/* ── STEP 9: FIGURE OUT BOT REPLY ────────────────
   This is the core logic. It reads the user's message,
   checks it for keywords, and returns a reply.
   
   msg = the user's message (already lowercased) */
function getBotReply(msg) {

  /* --- CHECK: Add homework ---
     Pattern: "add [subject] homework: [task]"
     Examples:
       "add math homework: page 32"
       "add english homework: write an essay"  */
  if (msg.includes('add') && msg.includes('homework')) {
    // Split at the colon to separate subject from task
    const colonIndex = msg.indexOf(':');
    
    if (colonIndex === -1) {
      // No colon found — ask the user to be more specific
      return "Please use the format:\n*Add [subject] homework: [task]*\nExample: Add math homework: page 32";
    }

    // Everything before the colon is the subject area
    const beforeColon = msg.substring(0, colonIndex);  // "add math homework"
    // Everything after the colon is the actual task
    const task = msg.substring(colonIndex + 1).trim(); // "page 32"

    // Extract subject by removing "add", "homework", "my" etc.
    const subject = beforeColon
      .replace('add', '')
      .replace('homework', '')
      .replace('my', '')
      .trim() || 'general';  // fallback if nothing remains

    if (!task) {
      return "What's the homework task? Example: Add math homework: read chapter 5";
    }

    // Push new homework object into the array
    homeworkList.push({ subject: subject, task: task });
    saveHomework();  // 💾 save to localStorage

    return `✅ Added to your homework list!\n📖 ${subject.toUpperCase()}: ${task}`;
  }


  /* --- CHECK: View homework ---
     Triggers on "what is my homework", "show homework",
     "homework list", "my homework" etc. */
  if (
    msg.includes('what is my homework') ||
    msg.includes('show homework')       ||
    msg.includes('homework list')       ||
    msg.includes('my homework')         ||
    msg.includes('what homework')
  ) {
    // Return a special flag — the main function handles building the card
    return '__SHOW_HOMEWORK__';
  }


  /* --- CHECK: Clear homework ---
     Triggers on "clear homework", "delete homework", "remove all" etc. */
  if (
    msg.includes('clear homework') ||
    msg.includes('delete homework')||
    msg.includes('remove all homework')
  ) {
    const count = homeworkList.length;
    homeworkList = [];   // empty the array
    saveHomework();
    return count > 0
      ? `🗑️ Cleared ${count} homework item${count > 1 ? 's' : ''}! Fresh start!`
      : "Nothing to clear — your list is already empty! 🎉";
  }


  /* --- CHECK: Keyword responses ---
     Loop through our responses map and check if the
     message contains any of the keywords. */
  for (const keyword in responses) {
    if (msg.includes(keyword)) {
      // Pick a random reply from the array for that keyword
      const options = responses[keyword];
      return options[Math.floor(Math.random() * options.length)];
    }
  }


  /* --- DEFAULT reply when nothing matches ---
     Give the user a helpful nudge. */
  const defaults = [
    "Hmm, I'm not sure about that 🤔 Try asking about your homework!",
    "I'm still learning! 😊 Try: 'Add math homework: page 5' or 'What is my homework?'",
    "Not sure what you mean! But I'm great at tracking homework 📚",
    "Could you rephrase that? Or type 'help' to see what I can do 😊",
  ];
  return defaults[Math.floor(Math.random() * defaults.length)];
}


/* ── STEP 10: MAIN SEND MESSAGE FUNCTION ─────────
   Called when the user presses Send or hits Enter.
   This is the "entry point" that runs everything. */
function sendMessage() {
  const rawText = userInput.value.trim();  // remove extra spaces

  // Don't do anything if the input is empty
  if (!rawText) return;

  // 1. Show the user's bubble on the right
  addBubble('user', rawText);

  // 2. Clear the input box
  userInput.value = '';

  // 3. Convert to lowercase for easy keyword matching
  const msgLower = rawText.toLowerCase();

  // 4. Show typing dots (gives a more realistic feel)
  showTyping();

  // 5. After a short delay, show the bot's reply
  //    setTimeout(function, milliseconds) — runs after delay
  setTimeout(function() {
    removeTyping();  // remove the dots

    const reply = getBotReply(msgLower);

    if (reply === '__SHOW_HOMEWORK__') {
      // Special case: show the homework card element
      addBubble('bot', buildHomeworkCard());
    } else {
      addBubble('bot', reply);
    }
  }, 600 + Math.random() * 400);  // random delay 600–1000ms (feels natural)
}


/* ── STEP 11: LISTEN FOR ENTER KEY ───────────────
   So the user can press Enter instead of clicking Send */
userInput.addEventListener('keydown', function(event) {
  // event.key is "Enter" when the user presses the Enter key
  if (event.key === 'Enter') {
    sendMessage();
  }
});


/* ── STEP 12: WELCOME MESSAGE ON LOAD ────────────
   When the page first loads, the bot says hello. */
window.addEventListener('load', function() {
  // Show "Today" date separator
  const sep = document.createElement('div');
  sep.className = 'date-separator';
  sep.textContent = 'Today';
  messagesArea.appendChild(sep);

  // Friendly greeting after a small delay
  setTimeout(function() {
    addBubble('bot',
      "Hey! 👋 I'm Study Buddy!\n\nI can help you track your homework. Try:\n• 'Add math homework: page 32'\n• 'What is my homework?'\n• Type 'help' for more options 📚"
    );
  }, 400);
});
