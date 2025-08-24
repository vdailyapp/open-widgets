import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent,
  Input,
  Label,
  Switch,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui';
import { Settings, Save, Trash2, Plus, Edit } from 'lucide-react';

interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: Date;
  priority: 'low' | 'medium' | 'high';
}

interface Config {
  darkMode: boolean;
  autoSave: boolean;
  defaultCategory: string;
}

const NoteTakingWidget = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [config, setConfig] = useState<Config>({
    darkMode: false,
    autoSave: true,
    defaultCategory: 'general'
  });
  const [currentNote, setCurrentNote] = useState<Partial<Note>>({
    title: '',
    content: '',
    category: 'general',
    priority: 'medium'
  });
  const [showSettings, setShowSettings] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);

  // Load data from localStorage
  useEffect(() => {
    const savedNotes = localStorage.getItem('shadcn-notes');
    const savedConfig = localStorage.getItem('shadcn-notes-config');
    
    if (savedNotes) {
      const parsedNotes = JSON.parse(savedNotes).map((note: any) => ({
        ...note,
        createdAt: new Date(note.createdAt)
      }));
      setNotes(parsedNotes);
    }
    
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('shadcn-notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('shadcn-notes-config', JSON.stringify(config));
  }, [config]);

  // Listen for postMessage configuration
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'NOTES_CONFIG') {
        setConfig(prevConfig => ({ ...prevConfig, ...event.data.config }));
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const addNote = () => {
    if (!currentNote.title?.trim() || !currentNote.content?.trim()) return;

    const newNote: Note = {
      id: Date.now().toString(),
      title: currentNote.title,
      content: currentNote.content,
      category: currentNote.category || 'general',
      priority: currentNote.priority || 'medium',
      createdAt: new Date()
    };

    setNotes(prev => [newNote, ...prev]);
    setCurrentNote({ title: '', content: '', category: 'general', priority: 'medium' });
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const categories = ['general', 'work', 'personal', 'ideas', 'todo'];

  return (
    <div className={`min-h-screen transition-all duration-300 ${
      config.darkMode ? 'dark bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">📝 Notes Widget</h1>
            <p className="text-muted-foreground">Powered by shadcn/ui components</p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Note Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add New Note
                </CardTitle>
                <CardDescription>
                  Create a new note with shadcn/ui components
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="note-title">Title</Label>
                  <Input
                    id="note-title"
                    placeholder="Enter note title..."
                    value={currentNote.title || ''}
                    onChange={(e) => setCurrentNote(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="note-category">Category</Label>
                  <Select
                    value={currentNote.category}
                    onValueChange={(value) => setCurrentNote(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="note-priority">Priority</Label>
                  <Select
                    value={currentNote.priority}
                    onValueChange={(value) => setCurrentNote(prev => ({ ...prev, priority: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="note-content">Content</Label>
                  <Textarea
                    id="note-content"
                    placeholder="Write your note here..."
                    rows={6}
                    value={currentNote.content || ''}
                    onChange={(e) => setCurrentNote(prev => ({ ...prev, content: e.target.value }))}
                  />
                </div>

                <Button onClick={addNote} className="w-full">
                  <Save className="mr-2 h-4 w-4" />
                  Add Note
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Notes List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Your Notes ({notes.length})</CardTitle>
                <CardDescription>
                  All your notes in one place
                </CardDescription>
              </CardHeader>
              <CardContent>
                {notes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No notes yet. Create your first note!</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {notes.map((note) => (
                      <Card key={note.id} className="border-l-4 border-l-primary">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold">{note.title}</h3>
                                <Badge variant="outline">{note.category}</Badge>
                                <Badge variant={getPriorityColor(note.priority) as any}>
                                  {note.priority}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {note.content}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {note.createdAt.toLocaleDateString()} at {note.createdAt.toLocaleTimeString()}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteNote(note.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Settings Dialog */}
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Settings</DialogTitle>
              <DialogDescription>
                Configure your notes widget preferences
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable dark theme
                  </p>
                </div>
                <Switch
                  checked={config.darkMode}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, darkMode: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto Save</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically save notes
                  </p>
                </div>
                <Switch
                  checked={config.autoSave}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, autoSave: checked }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Default Category</Label>
                <Select
                  value={config.defaultCategory}
                  onValueChange={(value) => setConfig(prev => ({ ...prev, defaultCategory: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setShowSettings(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowSettings(false)}>
                Save Settings
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Floating Settings Button */}
        <Button
          onClick={() => setShowSettings(true)}
          size="icon"
          className="fixed bottom-4 right-4 shadow-lg"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default NoteTakingWidget;