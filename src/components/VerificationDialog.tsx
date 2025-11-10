import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ExternalLink, Loader2 } from 'lucide-react';

interface VerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
  taskName: string;
  taskType: 'twitter-follow' | 'twitter-likes' | 'twitter-tags' | 'telegram';
  actionUrl?: string;
  onVerify: (username: string, additionalData?: any) => Promise<boolean>;
}

export function VerificationDialog({
  open,
  onOpenChange,
  taskId,
  taskName,
  taskType,
  actionUrl,
  onVerify,
}: VerificationDialogProps) {
  const [username, setUsername] = useState('');
  const [tweetUrl, setTweetUrl] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  const handleOpenAction = () => {
    if (actionUrl) {
      window.open(actionUrl, '_blank');
    }
  };

  const handleVerify = async () => {
    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const additionalData = taskType === 'twitter-tags' ? { tweetUrl } : undefined;
      const success = await onVerify(username, additionalData);
      
      if (success) {
        onOpenChange(false);
        setUsername('');
        setTweetUrl('');
      } else {
        setError('Verification failed. Please make sure you completed the task.');
      }
    } catch (err) {
      setError('An error occurred during verification. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const getInputLabel = () => {
    switch (taskType) {
      case 'twitter-follow':
      case 'twitter-likes':
      case 'twitter-tags':
        return 'Your Twitter/X Username';
      case 'telegram':
        return 'Your Telegram User ID';
      default:
        return 'Username';
    }
  };

  const getInputPlaceholder = () => {
    switch (taskType) {
      case 'twitter-follow':
      case 'twitter-likes':
      case 'twitter-tags':
        return '@yourusername';
      case 'telegram':
        return '123456789';
      default:
        return 'Enter username';
    }
  };

  const getDescription = () => {
    switch (taskType) {
      case 'twitter-follow':
        return 'Follow our account on X/Twitter, then enter your username below to verify.';
      case 'twitter-likes':
        return 'Like 3 recent posts on our X/Twitter profile, then verify with your username.';
      case 'twitter-tags':
        return 'Tag 3 friends in our latest X/Twitter post, then provide your username and the tweet URL to verify.';
      case 'telegram':
        return 'Join our Telegram community, then get your User ID from @SmartSentinels_BOT by sending /start command.';
      default:
        return 'Complete the task and verify with your username.';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            Verify: {taskName}
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            {getDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Open action button */}
          {actionUrl && (
            <Button
              onClick={handleOpenAction}
              variant="outline"
              className="w-full"
              type="button"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              {taskType === 'telegram' ? 'Join Telegram Group' : 'Open X/Twitter'}
            </Button>
          )}

          {/* Telegram bot link */}
          {taskType === 'telegram' && (
            <Button
              onClick={() => window.open('https://t.me/SmartSentinels_BOT', '_blank')}
              variant="outline"
              className="w-full"
              type="button"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Get User ID from Bot
            </Button>
          )}

          {/* Username input */}
          <div className="space-y-2">
            <Label htmlFor="username">{getInputLabel()}</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={getInputPlaceholder()}
              className="w-full"
            />
            {taskType === 'telegram' && (
              <p className="text-xs text-muted-foreground">
                Send /start to @SmartSentinels_BOT to get your numeric User ID
              </p>
            )}
          </div>

          {/* Tweet URL for tag verification */}
          {taskType === 'twitter-tags' && (
            <div className="space-y-2">
              <Label htmlFor="tweetUrl">Tweet URL (optional)</Label>
              <Input
                id="tweetUrl"
                value={tweetUrl}
                onChange={(e) => setTweetUrl(e.target.value)}
                placeholder="https://twitter.com/..."
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Paste the URL of the tweet where you tagged friends
              </p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isVerifying}
          >
            Cancel
          </Button>
          <Button
            onClick={handleVerify}
            disabled={isVerifying || !username.trim()}
            className="min-w-[100px]"
          >
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
