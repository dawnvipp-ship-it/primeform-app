import ChatThread from '../../../components/chat/ChatThread'

export default function MessagesSection({ clientId }) {
  return <ChatThread clientId={clientId} sender="coach" />
}
