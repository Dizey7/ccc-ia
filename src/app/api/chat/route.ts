import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { store } from '@/lib/store';
import { processQuery } from '@/lib/chat-engine';
import { ChatMessage } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { message, fileId } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message requis' }, { status: 400 });
    }

    // Get agents from specific file or all files
    let agents;
    if (fileId) {
      const file = store.getFile(fileId);
      if (!file) {
        return NextResponse.json({ error: 'Fichier non trouvé' }, { status: 404 });
      }
      agents = file.agents || [];
    } else {
      agents = store.getAllAgentsFromFiles();
    }

    if (agents.length === 0) {
      return NextResponse.json({
        response: {
          id: uuidv4(),
          role: 'assistant',
          content: "Aucune donnée d'agents disponible. Veuillez d'abord importer un fichier Excel, CSV ou PDF contenant une liste d'agents.",
          timestamp: new Date().toISOString(),
        }
      });
    }

    // Process the query
    const result = processQuery(message, agents);

    const responseMessage: ChatMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: result.response,
      timestamp: new Date().toISOString(),
      data: result.data,
    };

    // Save to chat history
    const chatFileId = fileId || 'global';
    store.addChatMessage(chatFileId, {
      id: uuidv4(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    });
    store.addChatMessage(chatFileId, responseMessage);

    return NextResponse.json({ response: responseMessage });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: 'Erreur lors du traitement de la requête' }, { status: 500 });
  }
}
