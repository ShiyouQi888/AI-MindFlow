import React, { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, LogOut, CreditCard, LogIn, Loader2, HelpCircle, Zap, Settings, Bot } from 'lucide-react';
import { toast } from 'sonner';
import AuthModal from './AuthModal';
import SubscriptionModal from './SubscriptionModal';
import HelpGuideModal from '../mindmap/HelpGuideModal';
import UserCenter from '../mindmap/UserCenter';

const UserMenu: React.FC = () => {
  const { user, profile, subscription, signOut, loading, isAuthModalOpen, setAuthModalOpen } = useAuthStore();
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isUserCenterOpen, setIsUserCenterOpen] = useState(false);

  if (loading) {
    return <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />;
  }

  if (!user) {
    return (
      <>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 border-primary/20 hover:border-primary/50 bg-background/50"
          onClick={() => setAuthModalOpen(true)}
        >
          <LogIn className="w-4 h-4" />
          登录 / 注册
        </Button>
        <AuthModal open={isAuthModalOpen} onOpenChange={setAuthModalOpen} />
      </>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile?.avatar_url} alt={user.email} />
              <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium leading-none">{profile?.username || '用户'}</p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                  subscription?.plan_type === 'pro' 
                    ? 'bg-primary/10 text-primary border-primary/20' 
                    : 'bg-muted text-muted-foreground border-transparent'
                }`}>
                  {subscription?.plan_type === 'pro' ? 'PRO' : 'FREE'}
                </span>
              </div>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            className="gap-2 cursor-pointer" 
            onClick={() => setIsUserCenterOpen(true)}
          >
            <User className="w-4 h-4" />
            <span>用户中心</span>
          </DropdownMenuItem>

          <DropdownMenuItem 
            className="gap-2 cursor-pointer" 
            onClick={() => setIsSubModalOpen(true)}
          >
            <Zap className="w-4 h-4 text-amber-500" />
            <span>我的订阅</span>
          </DropdownMenuItem>

          <DropdownMenuItem 
            className="gap-2 cursor-pointer"
            onClick={() => setIsHelpModalOpen(true)}
          >
            <HelpCircle className="w-4 h-4" />
            <span>帮助指南</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-red-600 gap-2 cursor-pointer" onClick={() => signOut()}>
            <LogOut className="w-4 h-4" />
            <span>退出登录</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AuthModal open={isAuthModalOpen} onOpenChange={setAuthModalOpen} />
      <SubscriptionModal open={isSubModalOpen} onOpenChange={setIsSubModalOpen} />
      <HelpGuideModal open={isHelpModalOpen} onOpenChange={setIsHelpModalOpen} />
      <UserCenter open={isUserCenterOpen} onOpenChange={setIsUserCenterOpen} />
    </>
  );
};

export default UserMenu;
