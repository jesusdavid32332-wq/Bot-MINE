/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AccountVerificationStatus, DepositReceipt, SectionId, TelegramUser } from './types';
import { StorageService } from './services/storage';
import { DataService } from './services/dataService';
import { isErrorObject, safeText, sanitizeUsers, sanitizeConversations } from './utils/safeText';

// Layout Components
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { BotChatSimulatorModal } from './components/ui/BotChatSimulatorModal';

// Section Views
import { DashboardView } from './components/dashboard/DashboardView';
import { DepositVerificationView } from './components/deposits/DepositVerificationView';
import { MessagesView } from './components/messages/MessagesView';
import { FlowView } from './components/flow/FlowView';
import { AccountVerificationView } from './components/id-tracking/AccountVerificationView';
import { TelegramAdminMenuView } from './components/admin-telegram/TelegramAdminMenuView';
import { MediaView } from './components/media/MediaView';
import { TutorialsView } from './components/tutorials/TutorialsView';
import { UsersView } from './components/users/UsersView';
import { ConversationsView } from './components/conversations/ConversationsView';
import { SupportView } from './components/support/SupportView';
import { LinksView } from './components/links/LinksView';
import { BotConfigView } from './components/bot-config/BotConfigView';
import { GeneralConfigView } from './components/general-config/GeneralConfigView';
import { TelegramConnectionView } from './components/telegram-connection/TelegramConnectionView';

export default function App() {
  const [currentSection, setCurrentSection] = useState<SectionId>('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [selectedUserIdForChat, setSelectedUserIdForChat] = useState<string | undefined>(undefined);

  // Core Data States loaded from StorageService
  const [botConfig, setBotConfig] = useState(StorageService.getBotConfig());
  const [keywordConfig, setKeywordConfig] = useState(StorageService.getKeywordConfig());
  const [messages, setMessages] = useState(StorageService.getMessages());
  const [mediaItems, setMediaItems] = useState(StorageService.getMediaItems());
  const [tutorials, setTutorials] = useState(StorageService.getTutorials());
  const [users, setUsers] = useState(StorageService.getUsers());
  const [conversations, setConversations] = useState(StorageService.getConversations());
  const [supportTickets, setSupportTickets] = useState(StorageService.getSupportTickets());
  const [trackedLinks, setTrackedLinks] = useState(StorageService.getTrackedLinks());
  const [generalConfig, setGeneralConfig] = useState(StorageService.getGeneralConfig());
  const [deposits, setDeposits] = useState<DepositReceipt[]>([]);

  // Connect polling/sync with Neon PostgreSQL via DataService
  useEffect(() => {
    let isMounted = true;

    const fetchAllData = async () => {
      try {
        const [
          remoteUsers,
          remoteMessages,
          remoteMedia,
          remoteConditions,
          remoteBotConfig,
          remoteGeneralConfig,
          remoteConvs,
          remoteDeposits,
        ] = await Promise.allSettled([
          DataService.getUsers(),
          DataService.getMessages(),
          DataService.getMedia(),
          DataService.getConditions(),
          DataService.getBotConfig(),
          DataService.getGeneralConfig(),
          DataService.getConversations(),
          DataService.getDeposits(),
        ]);

        if (!isMounted) return;

        if (remoteUsers.status === 'fulfilled' && Array.isArray(remoteUsers.value) && !isErrorObject(remoteUsers.value)) {
          setUsers(sanitizeUsers(remoteUsers.value));
        }
        if (remoteMessages.status === 'fulfilled' && Array.isArray(remoteMessages.value) && !isErrorObject(remoteMessages.value) && remoteMessages.value.length > 0) {
          setMessages(remoteMessages.value);
        }
        if (remoteMedia.status === 'fulfilled' && Array.isArray(remoteMedia.value) && !isErrorObject(remoteMedia.value) && remoteMedia.value.length > 0) {
          setMediaItems(remoteMedia.value);
        }
        if (remoteConditions.status === 'fulfilled' && remoteConditions.value && !isErrorObject(remoteConditions.value)) {
          setKeywordConfig((prev) => ({ ...prev, ...remoteConditions.value }));
        }
        if (remoteBotConfig.status === 'fulfilled' && remoteBotConfig.value && !isErrorObject(remoteBotConfig.value)) {
          setBotConfig((prev) => ({ ...prev, ...remoteBotConfig.value }));
        }
        if (remoteGeneralConfig.status === 'fulfilled' && remoteGeneralConfig.value && !isErrorObject(remoteGeneralConfig.value)) {
          setGeneralConfig((prev) => ({ ...prev, ...remoteGeneralConfig.value }));
        }
        if (remoteConvs.status === 'fulfilled' && remoteConvs.value && !isErrorObject(remoteConvs.value) && Object.keys(remoteConvs.value).length > 0) {
          setConversations(sanitizeConversations(remoteConvs.value));
        }
        if (remoteDeposits.status === 'fulfilled' && Array.isArray(remoteDeposits.value) && !isErrorObject(remoteDeposits.value)) {
          setDeposits(remoteDeposits.value);
        }
      } catch (err) {
        console.warn('[App] Error sincronizando con base de datos Neon:', err);
      }
    };

    fetchAllData();
    const interval = setInterval(fetchAllData, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Reload all from storage if reset
  const handleReloadAll = () => {
    StorageService.resetAllToDemo();
    setBotConfig(StorageService.getBotConfig());
    setKeywordConfig(StorageService.getKeywordConfig());
    setMessages(StorageService.getMessages());
    setMediaItems(StorageService.getMediaItems());
    setTutorials(StorageService.getTutorials());
    setUsers(StorageService.getUsers());
    setConversations(StorageService.getConversations());
    setSupportTickets(StorageService.getSupportTickets());
    setTrackedLinks(StorageService.getTrackedLinks());
    setGeneralConfig(StorageService.getGeneralConfig());
  };

  // Refresh Users, Deposits & Conversations from DB
  const handleRefreshAll = async () => {
    try {
      const [remoteUsers, remoteDeposits, remoteConvs] = await Promise.allSettled([
        DataService.getUsers(),
        DataService.getDeposits(),
        DataService.getConversations(),
      ]);
      if (remoteUsers.status === 'fulfilled' && Array.isArray(remoteUsers.value) && !isErrorObject(remoteUsers.value)) {
        setUsers(sanitizeUsers(remoteUsers.value));
      }
      if (remoteDeposits.status === 'fulfilled' && Array.isArray(remoteDeposits.value) && !isErrorObject(remoteDeposits.value)) {
        setDeposits(remoteDeposits.value);
      }
      if (remoteConvs.status === 'fulfilled' && remoteConvs.value && !isErrorObject(remoteConvs.value) && Object.keys(remoteConvs.value).length > 0) {
        setConversations(sanitizeConversations(remoteConvs.value));
      }
    } catch (err) {
      console.warn('[App] Error actualizando datos:', err);
    }
  };

  const handleRefreshUsers = handleRefreshAll;

  // Update Account Verification Status
  const handleUpdateUserVerificationStatus = (
    telegramId: string,
    status: AccountVerificationStatus,
    notes?: string
  ) => {
    const cleanNotes = notes !== undefined ? safeText(notes) : undefined;
    const updated = users.map((u) =>
      u.telegramId === telegramId ? { ...u, accountStatus: status, notes: cleanNotes !== undefined ? cleanNotes : u.notes } : u
    );
    setUsers(updated);
    StorageService.saveUsers(updated);
    DataService.updateUserStatus(telegramId, status, cleanNotes).catch(console.warn);
  };

  // Select user and jump to conversation
  const handleSelectUserForInspection = (user: TelegramUser) => {
    setSelectedUserIdForChat(user.id);
    setCurrentSection('conversations');
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans">
      {/* Main Administrative Layout with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar
          currentSection={currentSection}
          onSelectSection={(sec) => setCurrentSection(sec)}
          isMobileOpen={isMobileOpen}
          onCloseMobile={() => setIsMobileOpen(false)}
          usersCount={users.length}
          messagesCount={messages.length}
          trackedIdsCount={users.filter((u) => Boolean(u.accountId)).length}
          pendingDepositsCount={deposits.filter((d) => d.status === 'pending').length}
        />

        {/* Content Viewport */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Header Bar */}
          <Header
            currentSection={currentSection}
            onOpenMobile={() => setIsMobileOpen(true)}
            onOpenSimulator={() => setIsSimulatorOpen(true)}
            onRefreshData={handleRefreshAll}
          />

          {/* Page Body Viewport */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {currentSection === 'dashboard' && (
              <DashboardView
                users={users}
                onSelectUser={handleSelectUserForInspection}
                onNavigateSection={(sec) => setCurrentSection(sec)}
                onOpenSimulator={() => setIsSimulatorOpen(true)}
              />
            )}

            {currentSection === 'deposits' && (
              <DepositVerificationView
                deposits={deposits}
                users={users}
                onRefreshAll={handleRefreshAll}
                onSelectUserForChat={handleSelectUserForInspection}
              />
            )}

            {currentSection === 'telegram-connection' && (
              <TelegramConnectionView adminTelegramId={generalConfig.adminTelegramId || '684920153'} />
            )}

            {currentSection === 'messages' && (
              <MessagesView
                messages={messages}
                mediaItems={mediaItems}
                onSaveMessages={(updated) => {
                  setMessages(updated);
                  StorageService.saveMessages(updated);
                }}
                onAddMedia={(item) => {
                  const updated = [item, ...mediaItems];
                  setMediaItems(updated);
                  StorageService.saveMediaItems(updated);
                }}
              />
            )}

            {currentSection === 'flow' && <FlowView />}

            {currentSection === 'id-tracking' && (
              <AccountVerificationView
                users={users}
                onUpdateUserStatus={handleUpdateUserVerificationStatus}
                onRefreshUsers={handleRefreshUsers}
              />
            )}

            {currentSection === 'admin-telegram' && (
              <TelegramAdminMenuView
                botConfig={botConfig}
                keywordConfig={keywordConfig}
                users={users}
                onSaveBotConfig={(updated) => {
                  setBotConfig(updated);
                  StorageService.saveBotConfig(updated);
                }}
                onSaveKeywordConfig={(updated) => {
                  setKeywordConfig(updated);
                  StorageService.saveKeywordConfig(updated);
                }}
              />
            )}

            {currentSection === 'media' && (
              <MediaView
                mediaItems={mediaItems}
                onSaveMedia={(updated) => {
                  setMediaItems(updated);
                  StorageService.saveMediaItems(updated);
                }}
              />
            )}

            {currentSection === 'tutorials' && (
              <TutorialsView
                tutorials={tutorials}
                mediaItems={mediaItems}
                onSaveTutorials={(updated) => {
                  setTutorials(updated);
                  StorageService.saveTutorials(updated);
                }}
              />
            )}

            {currentSection === 'users' && (
              <UsersView
                users={users}
                conversations={conversations}
                onSelectUserForChat={handleSelectUserForInspection}
                onRefreshUsers={handleRefreshAll}
              />
            )}

            {currentSection === 'conversations' && (
              <ConversationsView
                users={users}
                conversations={conversations}
                onSaveConversations={(updated) => {
                  setConversations(updated);
                  StorageService.saveConversations(updated);
                }}
                initialSelectedUserId={selectedUserIdForChat}
              />
            )}

            {currentSection === 'support' && (
              <SupportView
                tickets={supportTickets}
                onSaveTickets={(updated) => {
                  setSupportTickets(updated);
                  StorageService.saveSupportTickets(updated);
                }}
              />
            )}

            {currentSection === 'links' && (
              <LinksView
                links={trackedLinks}
                onSaveLinks={(updated) => {
                  setTrackedLinks(updated);
                  StorageService.saveTrackedLinks(updated);
                }}
              />
            )}

            {currentSection === 'bot-config' && (
              <BotConfigView
                config={botConfig}
                onSaveConfig={(updated) => {
                  setBotConfig(updated);
                  StorageService.saveBotConfig(updated);
                }}
              />
            )}

            {currentSection === 'general-config' && (
              <GeneralConfigView
                config={generalConfig}
                onSaveConfig={(updated) => {
                  setGeneralConfig(updated);
                  StorageService.saveGeneralConfig(updated);
                }}
                onResetAllDemoData={handleReloadAll}
              />
            )}
          </main>
        </div>
      </div>

      {/* Global Interactive Bot Chat Simulator Modal */}
      <BotChatSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        messages={messages}
      />
    </div>
  );
}
