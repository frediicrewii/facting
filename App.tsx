import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BotConfig } from './components/BotConfig';
import { LivePreview } from './components/LivePreview';
import { ActivityLog } from './components/ActivityLog';
import { LogEntry, GeneratedContent, BotStatus, Recipient, Topic } from './types';
import { generateFact, generateImageForFact } from './services/geminiService';
import { postToTelegram, getBotUpdates } from './services/telegramService';

// Default provided in prompt for testing convenience
const DEFAULT_BOT_TOKEN = "7532465892:AAG8VYzKu6rdNt8FAbWKTXG9xTbCDFppmxk";

const App: React.FC = () => {
  const [botToken, setBotToken] = useState(DEFAULT_BOT_TOKEN);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [status, setStatus] = useState<BotStatus>(BotStatus.IDLE);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [lastContent, setLastContent] = useState<GeneratedContent | null>(null);
  
  // Configuration State
  const [topic, setTopic] = useState<Topic>('Random');
  const [intervalMinutes, setIntervalMinutes] = useState<number>(1);
  
  // Timer state
  const [secondsUntilNext, setSecondsUntilNext] = useState(60);
  const timerRef = useRef<number | null>(null);
  const cycleRef = useRef<number | null>(null);

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    const entry: LogEntry = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date(),
      message,
      type
    };
    setLogs(prev => [...prev, entry]);
  };

  // Recipient Management
  const addManualRecipient = (chatId: string) => {
    if (recipients.some(r => r.chatId === chatId)) {
      addLog(`Recipient ${chatId} already exists`, 'warning');
      return;
    }
    setRecipients(prev => [...prev, {
      chatId,
      name: chatId,
      type: 'unknown',
      selected: true,
      joinedAt: new Date()
    }]);
    addLog(`Added manual recipient: ${chatId}`, 'success');
  };

  const toggleRecipient = (chatId: string) => {
    setRecipients(prev => prev.map(r => 
      r.chatId === chatId ? { ...r, selected: !r.selected } : r
    ));
  };

  const scanForRecipients = async () => {
    if (!botToken) {
      addLog("Cannot sync: Missing Bot Token", 'error');
      return;
    }
    
    addLog("Scanning for updates...", 'info');
    try {
      const updates = await getBotUpdates(botToken);
      
      const recipientMap = new Map(recipients.map(r => [r.chatId, r]));
      let addedCount = 0;
      let removedCount = 0;

      updates.forEach((u: any) => {
        // 1. Handle New Messages (Add User)
        const chat = u.message?.chat || u.channel_post?.chat;
        if (chat) {
          const chatId = String(chat.id);
          if (!recipientMap.has(chatId)) {
            let name = chat.title || chat.username || chat.first_name || `User ${chat.id}`;
            if (chat.last_name) name += ` ${chat.last_name}`;

            recipientMap.set(chatId, {
              chatId,
              name,
              type: chat.type || 'unknown',
              selected: true,
              joinedAt: new Date()
            });
            addedCount++;
          }
        }

        // 2. Handle Status Changes (Block/Stop => Remove User)
        if (u.my_chat_member) {
          const status = u.my_chat_member.new_chat_member?.status;
          const chatId = String(u.my_chat_member.chat.id);
          
          if (status === 'kicked' || status === 'left') {
            if (recipientMap.has(chatId)) {
              recipientMap.delete(chatId);
              removedCount++;
            }
          } 
          else if (['member', 'administrator', 'creator'].includes(status)) {
             if (!recipientMap.has(chatId)) {
                const chat = u.my_chat_member.chat;
                let name = chat.title || chat.username || chat.first_name || `User ${chat.id}`;
                if (chat.last_name) name += ` ${chat.last_name}`;
                
                recipientMap.set(chatId, {
                    chatId,
                    name,
                    type: chat.type || 'unknown',
                    selected: true,
                    joinedAt: new Date()
                });
                addedCount++;
             }
          }
        }
      });

      if (addedCount > 0 || removedCount > 0) {
        setRecipients(Array.from(recipientMap.values()));
        if (addedCount > 0) addLog(`Synced: Found ${addedCount} new subscribers.`, 'success');
        if (removedCount > 0) addLog(`Synced: Removed ${removedCount} inactive users.`, 'warning');
      } else {
        addLog("Sync complete. List is up to date.", 'info');
      }

    } catch (e: any) {
      addLog(`Scan failed: ${e.message}`, 'error');
    }
  };

  const executeCycle = useCallback(async () => {
    const activeRecipients = recipients.filter(r => r.selected);
    
    if (activeRecipients.length === 0) {
      addLog("Cannot start: No recipients selected", 'error');
      setStatus(BotStatus.IDLE);
      return;
    }

    try {
      setStatus(BotStatus.GENERATING_TEXT);
      addLog(`Generating ${topic} fact (Russian)...`, 'info');
      
      const fact = await generateFact(topic);
      addLog(`Fact generated: "${fact.substring(0, 30)}..."`, 'success');

      setStatus(BotStatus.GENERATING_IMAGE);
      addLog("Generating visual representation...", 'info');
      
      const imageBase64 = await generateImageForFact(fact);
      addLog("Image generated successfully", 'success');

      setLastContent({
        fact,
        imageBase64,
        timestamp: new Date()
      });

      setStatus(BotStatus.POSTING);
      addLog(`Broadcasting to ${activeRecipients.length} recipients...`, 'info');
      
      let successCount = 0;
      for (const recipient of activeRecipients) {
        try {
          await postToTelegram(botToken, recipient.chatId, imageBase64, fact);
          successCount++;
        } catch (e) {
          addLog(`Failed to send to ${recipient.name}: ${e}`, 'error');
        }
      }

      if (successCount === activeRecipients.length) {
        addLog(`Successfully broadcasted to all ${successCount} targets!`, 'success');
      } else if (successCount > 0) {
        addLog(`Partial success: Sent to ${successCount}/${activeRecipients.length}`, 'warning');
      } else {
        throw new Error("Failed to send to any recipients");
      }
      
      setStatus(BotStatus.WAITING);
      setSecondsUntilNext(intervalMinutes * 60);

    } catch (error: any) {
      addLog(error.message || "An unexpected error occurred", 'error');
      setStatus(BotStatus.WAITING);
      setSecondsUntilNext(intervalMinutes * 60); // Use configurable interval on retry
    }
  }, [botToken, recipients, topic, intervalMinutes]);

  // Main Interval Logic
  useEffect(() => {
    if (status === BotStatus.IDLE) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (cycleRef.current) clearTimeout(cycleRef.current);
      return;
    }

    // Timer countdown
    if (status === BotStatus.WAITING) {
      timerRef.current = window.setInterval(() => {
        setSecondsUntilNext(prev => {
          if (prev <= 1) {
            // Trigger next cycle
            if (timerRef.current) clearInterval(timerRef.current);
            executeCycle();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, executeCycle]);

  const toggleBot = () => {
    if (status !== BotStatus.IDLE) {
      setStatus(BotStatus.IDLE);
      addLog("Bot stopped by user", 'warning');
      setSecondsUntilNext(intervalMinutes * 60);
    } else {
      if (recipients.filter(r => r.selected).length === 0) {
        alert("Please add or select at least one recipient.");
        return;
      }
      setStatus(BotStatus.WAITING);
      setSecondsUntilNext(0); // Run immediately on start
      addLog(`Bot started. Topic: ${topic}, Interval: ${intervalMinutes}m`, 'success');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-6 md:p-12 font-sans selection:bg-gemini/30">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-telegram to-gemini mb-2">
              AutoFact Bot
            </h1>
            <p className="text-slate-400">
              Automated Gemini-powered content generator for Telegram.
            </p>
          </div>
          <div className="mt-4 md:mt-0 px-4 py-2 bg-slate-800 rounded-full border border-slate-700 text-xs font-mono text-slate-400 flex items-center gap-3">
             <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Russian (RU)
             </span>
             <span className="w-px h-4 bg-slate-600"></span>
             <span>Powered by <span className="text-gemini font-bold">Gemini 2.5 Flash</span></span>
          </div>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Config & Logs */}
          <div className="lg:col-span-5 space-y-6 flex flex-col">
            <BotConfig 
              botToken={botToken}
              setBotToken={setBotToken}
              recipients={recipients}
              toggleRecipient={toggleRecipient}
              addManualRecipient={addManualRecipient}
              scanForRecipients={scanForRecipients}
              status={status}
              toggleBot={toggleBot}
              secondsUntilNext={secondsUntilNext}
              topic={topic}
              setTopic={setTopic}
              intervalMinutes={intervalMinutes}
              setIntervalMinutes={setIntervalMinutes}
            />
            
            <ActivityLog logs={logs} />
          </div>

          {/* Right Column: Preview */}
          <div className="lg:col-span-7">
            <div className="h-full flex flex-col space-y-4">
               <LivePreview content={lastContent} />
               <div className="bg-amber-900/20 border border-amber-900/50 p-4 rounded-lg text-sm text-amber-200/80">
                <strong>Tip:</strong> Send <code>/start</code> to your bot in Telegram, then click <strong>Sync Subscribers</strong>. Users who block the bot will be removed during sync.
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default App;