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
  const [taggedFriends, setTaggedFriends] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  // Hardcoded campaign tweet URL for like-post and twitter-tags
  const CAMPAIGN_TWEET_URL = 'https://x.com/SmartSentinels_/status/2001240645239705979';

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

      if (taskType === 'twitter-tags') {
        if (!taggedFriends.trim()) {
          setError('Please enter the tagged friends usernames');
          return;
        }
      }    setIsVerifying(true);
    setError('');

    try {
      const additionalData = taskType === 'twitter-tags' ? { tweetUrl: CAMPAIGN_TWEET_URL, taggedFriends } : undefined;
      const success = await onVerify(username, additionalData);
      
      if (success) {
        onOpenChange(false);
        setUsername('');
        setTaggedFriends('');
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
        return 'Your Telegram Username';
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
        return '@yourusername';
      default:
        return 'Enter username';
    }
  };

  const getDescription = () => {
    switch (taskType) {
      case 'twitter-follow':
        return 'Follow our account on X/Twitter, then enter your username below to verify.';
      case 'twitter-likes':
        return 'Like the announcement post on X/Twitter, then enter your username below for admin verification.';
      case 'twitter-tags':
        return 'Tag 3 friends in our campaign post on X/Twitter, then provide your username and the tagged usernames for admin verification.';
      case 'telegram':
        return 'Join our Telegram community, then enter your Telegram username below for admin verification.';
      default:
        return 'Complete the task and verify with your username';
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
          </div>

          {/* Tagged Friends Input - only for twitter-tags */}
          {taskType === 'twitter-tags' && (
            <div className="space-y-2">
              <label htmlFor="tagged-friends" className="text-sm font-medium">
                Tagged Friends Usernames
              </label>
              <Input
                id="tagged-friends"
                value={taggedFriends}
                onChange={(e) => setTaggedFriends(e.target.value)}
                placeholder="@friend1, @friend2, @friend3"
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Enter the 3 usernames you tagged (comma separated)
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
