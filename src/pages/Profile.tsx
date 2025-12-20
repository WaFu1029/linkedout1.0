import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { 
  Loader2, 
  Heart, 
  Palette, 
  UtensilsCrossed, 
  Edit2, 
  Save, 
  X, 
  Plus, 
  Trash2, 
  Quote,
  Sparkles,
  ChevronDown,
  UserPlus,
  UserMinus,
  ShoppingCart,
  X as XIcon,
  Gift,
  Package,
  Flame,
  Bell,
  MessageSquare,
  ThumbsUp
} from "lucide-react";
import { FailurePost } from "@/components/FailurePost";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const industries = [
  "Software Engineering",
  "Design",
  "Marketing",
  "Finance",
  "Healthcare",
  "Education",
  "Freelance/Consulting",
  "Startup Founder",
  "Academia",
  "Creative Arts",
  "Student",
  "Unemployed",
  "Career Transition",
  "Retail",
  "Hospitality",
  "Real Estate",
  "Legal",
  "Engineering (Non-Software)",
  "Sales",
  "Human Resources",
  "Operations",
  "Product Management",
  "Data Science",
  "Content Creation",
  "Social Media",
  "Photography",
  "Music",
  "Writing",
  "Entrepreneurship",
  "Non-Profit",
  "Government",
  "Construction",
  "Manufacturing",
  "Transportation",
  "Food Service",
  "Fitness/Wellness",
  "Therapy/Counseling",
  "Research",
  "Consulting",
  "Other",
];

interface GardenCell {
  emoji: string;
  gifted?: boolean;
}

interface InventoryItem {
  emoji: string;
  count: number;
}

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  industry: string | null;
  favorite_food: string | null;
  favorite_color: string | null;
  favorite_artist: string | null;
  hobbies: string[] | null;
  motivational_quote: string | null;
  garden_grid?: (GardenCell | string | null)[][] | null;
  garden_points?: number | null;
  gifts_received?: number | null;
  inventory?: InventoryItem[] | null;
  login_streak?: number | null;
  last_login_date?: string | null;
}

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    industry: "",
    favorite_food: "",
    favorite_color: "",
    favorite_artist: "",
    hobbies: [] as string[],
    motivational_quote: "",
  });
  const [newHobby, setNewHobby] = useState("");
  const [saving, setSaving] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [hasIncomingRequest, setHasIncomingRequest] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionsCount, setConnectionsCount] = useState(0);
  
  // Notifications state
  const [connectionRequests, setConnectionRequests] = useState<Array<{id: string, user_id: string, full_name: string | null, email: string | null, industry: string | null, created_at: string}>>([]);
  const [commentNotifications, setCommentNotifications] = useState<Array<{id: string, post_id: string, author_id: string, author_name: string | null, author_email: string | null, content: string, created_at: string, post_title: string | null}>>([]);
  const [reactionNotifications, setReactionNotifications] = useState<Array<{id: string, post_id: string, user_id: string, user_name: string | null, user_email: string | null, reaction_type: string, created_at: string, post_title: string | null}>>([]);
  const [giftNotifications, setGiftNotifications] = useState<Array<{gifter_id: string, gifter_name: string | null, gifter_email: string | null, emoji: string, quantity: number, created_at: string}>>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  
  // Emoji garden grid state - supports both old format (string) and new format (object)
  const [gardenGrid, setGardenGrid] = useState<(GardenCell | string | null)[][]>(() => {
    // Initialize a 6x8 grid (48 cells total) - will be loaded from database
    const rows = 6;
    const cols = 8;
    return Array(rows).fill(null).map(() => Array(cols).fill(null));
  });
  
  // Shop and planting state
  const [points, setPoints] = useState(100);
  const [selectedVegetable, setSelectedVegetable] = useState<string | null>(null);
  const [shopOpen, setShopOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [giftMode, setGiftMode] = useState(false);
  const [gardenLoading, setGardenLoading] = useState(true);
  const [giftsReceived, setGiftsReceived] = useState(0);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [gifterInventory, setGifterInventory] = useState<InventoryItem[]>([]);
  const [harvestPopoverOpen, setHarvestPopoverOpen] = useState<{row: number, col: number} | null>(null);
  const [inventoryPopoverOpen, setInventoryPopoverOpen] = useState<number | null>(null);
  const [selectedFriendForGift, setSelectedFriendForGift] = useState<string | null>(null);
  const [mutualConnections, setMutualConnections] = useState<Array<{id: string, name: string}>>([]);
  const [vegetableToGift, setVegetableToGift] = useState<string | null>(null);
  const [giftQuantity, setGiftQuantity] = useState(1);
  
  // Categorized vegetables
  const fruits = [
    { emoji: '🍇', name: 'Grape', cost: 25 },
    { emoji: '🍈', name: 'Melon', cost: 30 },
    { emoji: '🍉', name: 'Watermelon', cost: 35 },
    { emoji: '🍊', name: 'Orange', cost: 20 },
    { emoji: '🍋', name: 'Lemon', cost: 18 },
    { emoji: '🍋‍🟩', name: 'Lime', cost: 18 },
    { emoji: '🍌', name: 'Banana', cost: 15 },
    { emoji: '🍍', name: 'Pineapple', cost: 40 },
    { emoji: '🥭', name: 'Mango', cost: 45 },
    { emoji: '🍎', name: 'Red Apple', cost: 20 },
    { emoji: '🍏', name: 'Green Apple', cost: 20 },
    { emoji: '🍐', name: 'Pear', cost: 22 },
    { emoji: '🍑', name: 'Peach', cost: 28 },
    { emoji: '🍒', name: 'Cherries', cost: 30 },
    { emoji: '🍓', name: 'Strawberry', cost: 25 },
    { emoji: '🫐', name: 'Blueberries', cost: 28 },
    { emoji: '🥝', name: 'Kiwi', cost: 32 },
    { emoji: '🫒', name: 'Olives', cost: 22 },
    { emoji: '🥥', name: 'Coconut', cost: 38 },
    { emoji: '🥑', name: 'Avocado', cost: 35 },
    { emoji: '🎃', name: 'Pumpkin', cost: 50 },
  ];
  
  const vegetables = [
    { emoji: '🍄', name: 'Mushroom', cost: 30 },
    { emoji: '🍆', name: 'Eggplant', cost: 30 },
    { emoji: '🥔', name: 'Potato', cost: 12 },
    { emoji: '🍠', name: 'Sweet Potato', cost: 14 },
    { emoji: '🥕', name: 'Carrot', cost: 10 },
    { emoji: '🌽', name: 'Corn', cost: 25 },
    { emoji: '🌶️', name: 'Hot Pepper', cost: 22 },
    { emoji: '🫑', name: 'Bell Pepper', cost: 20 },
    { emoji: '🥒', name: 'Cucumber', cost: 15 },
    { emoji: '🥬', name: 'Lettuce', cost: 15 },
    { emoji: '🥦', name: 'Broccoli', cost: 18 },
    { emoji: '🧄', name: 'Garlic', cost: 12 },
    { emoji: '🧅', name: 'Onion', cost: 10 },
    { emoji: '🥜', name: 'Peanuts', cost: 15 },
    { emoji: '🫘', name: 'Beans', cost: 14 },
    { emoji: '🌰', name: 'Chestnut', cost: 20 },
    { emoji: '🫚', name: 'Ginger', cost: 16 },
    { emoji: '🫛', name: 'Pea Pod', cost: 12 },
    { emoji: '🍄‍🟫', name: 'Brown Mushroom', cost: 32 },
    { emoji: '🍅', name: 'Tomato', cost: 20 },
  ];
  
  const flowers = [
    { emoji: '🏵️', name: 'Rosette', cost: 30 },
    { emoji: '🌹', name: 'Rose', cost: 45 },
    { emoji: '🌺', name: 'Hibiscus', cost: 38 },
    { emoji: '🌻', name: 'Sunflower', cost: 35 },
    { emoji: '🌼', name: 'Daisy', cost: 28 },
    { emoji: '🌷', name: 'Tulip', cost: 32 },
    { emoji: '🪻', name: 'Hyacinth', cost: 30 },
  ];
  
  const plants = [
    { emoji: '🌲', name: 'Evergreen Tree', cost: 55 },
    { emoji: '🌳', name: 'Deciduous Tree', cost: 55 },
    { emoji: '🌴', name: 'Palm Tree', cost: 60 },
    { emoji: '🌵', name: 'Cactus', cost: 40 },
    { emoji: '🌾', name: 'Rice', cost: 30 },
    { emoji: '🌿', name: 'Herb', cost: 25 },
    { emoji: '☘️', name: 'Shamrock', cost: 35 },
  ];
  
  // Combined array for backward compatibility
  const allVegetables = [...fruits, ...vegetables, ...flowers, ...plants];
  
  // Helper function to normalize garden cell (handle both old string format and new object format)
  const normalizeCell = (cell: GardenCell | string | null): GardenCell | null => {
    if (!cell) return null;
    if (typeof cell === 'string') return { emoji: cell, gifted: false };
    return cell;
  };

  // Helper function to get emoji from cell
  const getCellEmoji = (cell: GardenCell | string | null): string | null => {
    if (!cell) return null;
    if (typeof cell === 'string') return cell;
    return cell.emoji;
  };

  // Helper function to check if cell is gifted
  const isCellGifted = (cell: GardenCell | string | null): boolean => {
    if (!cell || typeof cell === 'string') return false;
    return cell.gifted === true;
  };

  // Helper function to add item to inventory
  const addToInventory = (emoji: string, currentInventory: InventoryItem[]): InventoryItem[] => {
    const newInventory = [...currentInventory];
    const existingItem = newInventory.find(item => item.emoji === emoji);
    
    if (existingItem) {
      existingItem.count += 1;
    } else {
      newInventory.push({ emoji, count: 1 });
    }
    
    return newInventory;
  };

  // Helper function to find random empty cell in garden grid
  const findRandomEmptyCell = (grid: (GardenCell | string | null)[][]): {row: number, col: number} | null => {
    const emptyCells: Array<{row: number, col: number}> = [];
    
    grid.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (!cell) {
          emptyCells.push({ row: rowIndex, col: colIndex });
        }
      });
    });
    
    if (emptyCells.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    return emptyCells[randomIndex];
  };

  // Delete item from inventory
  const handleDeleteFromInventory = async (emoji: string) => {
    if (!user || !isOwnProfile) return;

    // Check if user has this vegetable in inventory
    const inventoryItem = inventory.find(item => item.emoji === emoji);
    if (!inventoryItem || inventoryItem.count <= 0) {
      toast.error(`You don't have ${emoji} in your inventory!`);
      return;
    }

    // Remove one from inventory (or remove entirely if count is 1)
    const newInventory = inventory.map(item => {
      if (item.emoji === emoji) {
        return { ...item, count: item.count - 1 };
      }
      return item;
    }).filter(item => item.count > 0);

    const cleanInventory = newInventory.map(item => ({
      emoji: item.emoji,
      count: item.count
    }));

    // Update inventory in database
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          inventory: cleanInventory,
        })
        .eq("id", user.id);

      if (error) throw error;

      // Update local state
      setInventory(newInventory);
      setInventoryPopoverOpen(null);
      
      toast.success(`Deleted ${emoji} from inventory`);
    } catch (error) {
      console.error("Error deleting from inventory:", error);
      toast.error("Failed to delete item. Please try again.");
    }
  };

  // Gift from inventory to a friend
  const handleGiftFromInventory = async (emoji: string, friendId: string, quantity: number) => {
    if (!user || !isOwnProfile) return;

    // Check if user has enough of this vegetable in inventory
    const inventoryItem = inventory.find(item => item.emoji === emoji);
    if (!inventoryItem || inventoryItem.count < quantity) {
      toast.error(`You don't have enough ${emoji}! You have ${inventoryItem?.count || 0}, trying to gift ${quantity}.`);
      return;
    }

    // Fetch recipient's inventory
    try {
      const { data: recipientProfile, error: fetchError } = await supabase
        .from("profiles")
        .select("inventory, gifts_received")
        .eq("id", friendId)
        .single();

      if (fetchError) {
        console.error("Error fetching recipient profile:", fetchError);
        throw fetchError;
      }
      if (!recipientProfile) {
        toast.error("Friend not found");
        return;
      }

      // Parse recipient's inventory
      let recipientInventory: InventoryItem[] = [];
      if (recipientProfile.inventory && Array.isArray(recipientProfile.inventory)) {
        recipientInventory = recipientProfile.inventory.map((item: any) => ({
          emoji: item.emoji,
          count: typeof item.count === 'number' ? item.count : 1
        }));
      }

      // Add gifts to recipient's inventory
      const existingItem = recipientInventory.find(item => item.emoji === emoji);
      let newRecipientInventory: InventoryItem[];
      
      if (existingItem) {
        // Increment count if item already exists
        newRecipientInventory = recipientInventory.map(item =>
          item.emoji === emoji
            ? { ...item, count: item.count + quantity }
            : item
        );
      } else {
        // Add new item if it doesn't exist
        newRecipientInventory = [...recipientInventory, { emoji, count: quantity }];
      }

      const cleanRecipientInventory = newRecipientInventory.map(item => ({
        emoji: item.emoji,
        count: item.count
      }));

      // Update gifter's inventory (decrement by quantity, remove if 0)
      const newInventory = inventory.map(item => {
        if (item.emoji === emoji) {
          return { ...item, count: item.count - quantity };
        }
        return item;
      }).filter(item => item.count > 0);

      const cleanInventory = newInventory.map(item => ({
        emoji: item.emoji,
        count: item.count
      }));

      // Update recipient's inventory and gifts_received
      const { error: recipientError } = await supabase
        .from("profiles")
        .update({
          inventory: cleanRecipientInventory,
          gifts_received: (recipientProfile.gifts_received || 0) + quantity,
        })
        .eq("id", friendId);

      if (recipientError) {
        console.error("Error updating recipient inventory:", recipientError);
        console.error("Recipient ID:", friendId);
        console.error("Current user ID:", user.id);
        console.error("Recipient inventory data:", JSON.stringify(cleanRecipientInventory, null, 2));
        throw recipientError;
      }
      
      console.log(`Successfully updated recipient ${friendId}'s inventory with ${quantity}x ${emoji}`);

      // Update gifter's inventory
      const { error: gifterError } = await supabase
        .from("profiles")
        .update({
          inventory: cleanInventory,
        })
        .eq("id", user.id);

      if (gifterError) throw gifterError;

      // Update local state
      setInventory(newInventory);
      setVegetableToGift(null);
      setSelectedFriendForGift(null);
      setGiftQuantity(1);
      setInventoryPopoverOpen(null);

      const friendName = mutualConnections.find(c => c.id === friendId)?.name || "friend";
      toast.success(`Gifted ${quantity}x ${emoji} to ${friendName}!`);
    } catch (error: any) {
      console.error("Error gifting from inventory:", error);
      const errorMessage = error?.message || "Failed to send gift. Please try again.";
      toast.error(errorMessage);
    }
  };

  const handleHarvest = async (rowIndex: number, colIndex: number) => {
    if (!isOwnProfile || gardenLoading) return;

    // Guard: Check if profile is loaded
    if (!profile?.id) {
      toast.error("Profile not loaded");
      return;
    }

    const cell = gardenGrid[rowIndex][colIndex];
    const cellEmoji = getCellEmoji(cell);
    
    if (!cellEmoji) return;

    // Close popover
    setHarvestPopoverOpen(null);

    // Remove from garden
    const newGrid = gardenGrid.map((row, r) =>
      r === rowIndex
        ? row.map((c, col) => (col === colIndex ? null : c))
        : row
    );

    // Add to inventory
    const newInventory = addToInventory(cellEmoji, inventory);

    // Clean inventory data to ensure proper JSON format
    const cleanInventory = newInventory.map(item => ({
      emoji: item.emoji,
      count: item.count
    }));

    // Update local state immediately
    setGardenGrid(newGrid);
    setInventory(newInventory);

    // Save to database
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          garden_grid: newGrid,
          inventory: cleanInventory,
        })
        .eq("id", profile.id);

      if (error) {
        // Revert on error
        setGardenGrid(gardenGrid);
        setInventory(inventory);
        console.error("Error harvesting:", error);
        toast.error(`Failed to harvest: ${error.message}`);
      } else {
        toast.success(`Harvested ${cellEmoji}!`);
      }
    } catch (error) {
      // Revert on error
      setGardenGrid(gardenGrid);
      setInventory(inventory);
      console.error("Error harvesting:", error);
      toast.error("Failed to harvest. Please try again.");
    }
  };

  const handleCellClick = async (rowIndex: number, colIndex: number) => {
    if (gardenLoading) return;

    const cell = gardenGrid[rowIndex][colIndex];
    const cellEmoji = getCellEmoji(cell);

    // If clicking on an occupied cell in own garden, show harvest popover
    if (cellEmoji && isOwnProfile && !selectedVegetable) {
      setHarvestPopoverOpen({ row: rowIndex, col: colIndex });
      return;
    }

    // Otherwise, handle planting/gifting
    if (!selectedVegetable) {
      return; // Do nothing if no vegetable is selected
    }

    // Can only plant on own garden
    if (!isOwnProfile) {
      return;
    }
    
    // Check if cell is already occupied
    if (cellEmoji) {
      return;
    }
    
    // Find the vegetable from shop list
    const vegetable = allVegetables.find(v => v.emoji === selectedVegetable);
    if (!vegetable) return;

    // Check if user has enough points
    if (points < vegetable.cost) {
      toast.error(`Not enough points! You need ${vegetable.cost} points.`);
      return;
    }
    
    // Plant the vegetable (not gifted)
    const plantCell: GardenCell = { emoji: selectedVegetable, gifted: false };
    const newGrid = gardenGrid.map((row, r) =>
      r === rowIndex
        ? row.map((cell, c) => (c === colIndex ? plantCell : cell))
        : row
    );
    
    const newPoints = points - vegetable.cost;
    
    // Update local state immediately for better UX
    setGardenGrid(newGrid);
    setPoints(newPoints);
    setSelectedVegetable(null);
    
    // Save to database
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          garden_grid: newGrid,
          garden_points: newPoints,
        })
        .eq("id", profile?.id);
      
      if (error) {
        // Revert on error
        setGardenGrid(gardenGrid);
        setPoints(points);
        console.error("Error saving garden:", error);
        toast.error("Failed to save garden. Please try again.");
      } else {
        toast.success(`Planted ${vegetable.name}!`);
      }
    } catch (error) {
      // Revert on error
      setGardenGrid(gardenGrid);
      setPoints(points);
      console.error("Error saving garden:", error);
      toast.error("Failed to save garden. Please try again.");
    }
  };
  
  const handleVegetableSelect = (emoji: string, cost: number) => {
    // Normal planting mode (shop is only for own profile)
    if (points < cost) {
      toast.error(`Not enough points! You need ${cost} points.`);
      return;
    }
    setSelectedVegetable(emoji);
    setShopOpen(false);
    toast.success(`Selected ${allVegetables.find(v => v.emoji === emoji)?.name}. Click an empty cell to plant!`);
  };

  const isOwnProfile = !id || id === user?.id || user?.id === profile?.id;
  const profileId = id || user?.id || profile?.id;

  // Fetch posts for this profile
  const { data: userPosts = [], isLoading: postsLoading } = useQuery({
    queryKey: ["profile-posts", profileId],
    queryFn: async () => {
      if (!profileId) return [];
      
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("*")
        .eq("author_id", profileId)
        .order("created_at", { ascending: false });

      if (postsError) {
        // If table doesn't exist yet, return empty array
        if (postsError.code === "PGRST205" || postsError.message?.includes("Could not find the table")) {
          return [];
        }
        console.error("Error fetching posts:", postsError);
        return [];
      }

      if (!postsData || postsData.length === 0) {
        return [];
      }

      // Fetch reactions for all posts
      const postIds = postsData.map((p) => p.id);
      const { data: reactionsData } = await supabase
        .from("reactions")
        .select("*")
        .in("post_id", postIds);

      // Group reactions by post
      const reactionsByPost: Record<string, { like: number; dislike: number }> = {};
      reactionsData?.forEach((reaction) => {
        if (!reactionsByPost[reaction.post_id]) {
          reactionsByPost[reaction.post_id] = { like: 0, dislike: 0 };
        }
        if (reaction.reaction_type === 'like') {
          reactionsByPost[reaction.post_id].like += 1;
        } else if (reaction.reaction_type === 'dislike') {
          reactionsByPost[reaction.post_id].dislike += 1;
        }
      });

      // Fetch comments for all posts
      const { data: commentsData } = await supabase
        .from("comments")
        .select("*")
        .in("post_id", postIds)
        .order("created_at", { ascending: false });

      // Group comments by post
      const commentsByPost: Record<string, any[]> = {};
      commentsData?.forEach((comment) => {
        if (!commentsByPost[comment.post_id]) {
          commentsByPost[comment.post_id] = [];
        }
        commentsByPost[comment.post_id].push({
          text: comment.content,
        });
      });

      // Transform posts to match FailurePost format
      return postsData.map((post) => ({
        id: post.id,
        author: profile?.full_name || profile?.email?.split("@")[0] || "User",
        industry: profile?.industry || "Human Being",
        title: post.title || null,
        content: post.content,
        tags: post.tags || [],
        timestamp: formatDistanceToNow(new Date(post.created_at), { addSuffix: true }),
        reactions: reactionsByPost[post.id] || { like: 0, dislike: 0 },
        comments: commentsByPost[post.id] || [],
        author_id: post.author_id,
      }));
    },
    enabled: !!profileId && !!profile,
  });

  // Check connection status and get connections count
  useEffect(() => {
    const checkConnectionStatus = async () => {
      if (!user || !profileId || isOwnProfile) {
        setIsConnected(false);
        setIsPending(false);
        return;
      }

      try {
        // Check if current user has connected to this profile
        const { data: userToProfile } = await supabase
          .from("connections")
          .select("id")
          .eq("user_id", user.id)
          .eq("connected_user_id", profileId)
          .single();

        // Check if this profile has connected back to current user
        const { data: profileToUser } = await supabase
          .from("connections")
          .select("id")
          .eq("user_id", profileId)
          .eq("connected_user_id", user.id)
          .single();

        // Mutual connection exists only if both directions exist
        setIsConnected(!!userToProfile && !!profileToUser);
        // Pending if user sent connection but profile hasn't connected back
        setIsPending(!!userToProfile && !profileToUser);
        // Has incoming request if profile sent connection but user hasn't connected back
        setHasIncomingRequest(!!profileToUser && !userToProfile);
      } catch (error) {
        console.error("Error checking connection status:", error);
        setIsConnected(false);
        setIsPending(false);
        setHasIncomingRequest(false);
      }
    };

    const fetchConnectionsCount = async () => {
      if (!profileId) return;

      try {
        // Get all connections where this profile is involved
        const { data: outgoingConnections } = await supabase
          .from("connections")
          .select("connected_user_id")
          .eq("user_id", profileId);

        const { data: incomingConnections } = await supabase
          .from("connections")
          .select("user_id")
          .eq("connected_user_id", profileId);

        if (!outgoingConnections || !incomingConnections) {
          setConnectionsCount(0);
          return;
        }

        // Count mutual connections only
        const outgoingSet = new Set(outgoingConnections.map(c => c.connected_user_id));
        const incomingSet = new Set(incomingConnections.map(c => c.user_id));
        
        // Count users that appear in both sets (mutual connections)
        let mutualCount = 0;
        outgoingSet.forEach(userId => {
          if (incomingSet.has(userId)) {
            mutualCount++;
          }
        });

        setConnectionsCount(mutualCount);
      } catch (error) {
        console.error("Error fetching connections count:", error);
      }
    };

    if (profileId && user && !isOwnProfile) {
      checkConnectionStatus();
    }
    
    if (profileId) {
      fetchConnectionsCount();
    }
  }, [profileId, user, isOwnProfile]);

  // Fetch mutual connections for gifting
  useEffect(() => {
    const fetchMutualConnections = async () => {
      if (!user || !isOwnProfile) {
        setMutualConnections([]);
        return;
      }

      try {
        // Get all connections where current user is involved
        const { data: outgoingConnections } = await supabase
          .from("connections")
          .select("connected_user_id")
          .eq("user_id", user.id);

        const { data: incomingConnections } = await supabase
          .from("connections")
          .select("user_id")
          .eq("connected_user_id", user.id);

        if (!outgoingConnections || !incomingConnections) {
          setMutualConnections([]);
          return;
        }

        // Find mutual connections
        const outgoingSet = new Set(outgoingConnections.map(c => c.connected_user_id));
        const incomingSet = new Set(incomingConnections.map(c => c.user_id));
        
        const mutualIds: string[] = [];
        outgoingSet.forEach(userId => {
          if (incomingSet.has(userId)) {
            mutualIds.push(userId);
          }
        });

        // Fetch profile names for mutual connections
        if (mutualIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name, email")
            .in("id", mutualIds);

          if (profiles) {
            const connectionsList = profiles.map(p => ({
              id: p.id,
              name: p.full_name || p.email?.split("@")[0] || "User"
            }));
            setMutualConnections(connectionsList);
          }
        } else {
          setMutualConnections([]);
        }
      } catch (error) {
        console.error("Error fetching mutual connections:", error);
        setMutualConnections([]);
      }
    };

    if (isOwnProfile && user) {
      fetchMutualConnections();
    }
  }, [isOwnProfile, user]);

  // Fetch notifications for own profile
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!isOwnProfile || !user?.id) {
        setConnectionRequests([]);
        setCommentNotifications([]);
        setReactionNotifications([]);
        return;
      }

      setNotificationsLoading(true);
      try {
        // Fetch incoming connection requests (people who connected to you but you haven't connected back)
        const { data: incomingConnections, error: connError } = await supabase
          .from("connections")
          .select(`
            id,
            user_id,
            created_at,
            profiles!connections_user_id_fkey (
              full_name,
              email,
              industry
            )
          `)
          .eq("connected_user_id", user.id);

        if (!connError && incomingConnections) {
          // Check which ones don't have reverse connection
          const incomingUserIds = incomingConnections.map(c => c.user_id);
          if (incomingUserIds.length > 0) {
            const { data: outgoingConnections } = await supabase
              .from("connections")
              .select("connected_user_id")
              .eq("user_id", user.id)
              .in("connected_user_id", incomingUserIds);

            const outgoingSet = new Set(outgoingConnections?.map(c => c.connected_user_id) || []);
            const requests = incomingConnections
              .filter(c => !outgoingSet.has(c.user_id))
              .map(c => ({
                id: c.id,
                user_id: c.user_id,
                full_name: (c.profiles as any)?.full_name || null,
                email: (c.profiles as any)?.email || null,
                industry: (c.profiles as any)?.industry || null,
                created_at: c.created_at
              }));
            setConnectionRequests(requests);
          } else {
            setConnectionRequests([]);
          }
        }

        // Fetch comments on user's posts
        const { data: userPosts } = await supabase
          .from("posts")
          .select("id, title")
          .eq("author_id", user.id);

        if (userPosts && userPosts.length > 0) {
          const postIds = userPosts.map(p => p.id);
          const { data: comments, error: commentsError } = await supabase
            .from("comments")
            .select("id, post_id, author_id, content, created_at")
            .in("post_id", postIds)
            .neq("author_id", user.id) // Exclude own comments
            .order("created_at", { ascending: false })
            .limit(20);

          if (!commentsError && comments && comments.length > 0) {
            // Fetch profile data for comment authors
            const authorIds = [...new Set(comments.map(c => c.author_id))];
            const { data: authorProfiles } = await supabase
              .from("profiles")
              .select("id, full_name, email")
              .in("id", authorIds);

            const profileMap = new Map(authorProfiles?.map(p => [p.id, p]) || []);
            const postMap = new Map(userPosts.map(p => [p.id, p.title]));
            const commentNotifs = comments.map(c => {
              const profile = profileMap.get(c.author_id);
              return {
                id: c.id,
                post_id: c.post_id,
                author_id: c.author_id,
                author_name: profile?.full_name || null,
                author_email: profile?.email || null,
                content: c.content,
                created_at: c.created_at,
                post_title: postMap.get(c.post_id) || null
              };
            });
            setCommentNotifications(commentNotifs);
          } else {
            setCommentNotifications([]);
          }
        } else {
          setCommentNotifications([]);
        }

        // Fetch reactions on user's posts
        if (userPosts && userPosts.length > 0) {
          const postIds = userPosts.map(p => p.id);
          const { data: reactions, error: reactionsError } = await supabase
            .from("reactions")
            .select("id, post_id, user_id, reaction_type, created_at")
            .in("post_id", postIds)
            .neq("user_id", user.id) // Exclude own reactions
            .order("created_at", { ascending: false })
            .limit(20);

          if (!reactionsError && reactions && reactions.length > 0) {
            // Fetch profile data for reaction users
            const userIds = [...new Set(reactions.map(r => r.user_id))];
            const { data: userProfiles } = await supabase
              .from("profiles")
              .select("id, full_name, email")
              .in("id", userIds);

            const profileMap = new Map(userProfiles?.map(p => [p.id, p]) || []);
            const postMap = new Map(userPosts.map(p => [p.id, p.title]));
            const reactionNotifs = reactions.map(r => {
              const profile = profileMap.get(r.user_id);
              return {
                id: r.id,
                post_id: r.post_id,
                user_id: r.user_id,
                user_name: profile?.full_name || null,
                user_email: profile?.email || null,
                reaction_type: r.reaction_type,
                created_at: r.created_at,
                post_title: postMap.get(r.post_id) || null
              };
            });
            setReactionNotifications(reactionNotifs);
          } else {
            setReactionNotifications([]);
          }
        } else {
          setReactionNotifications([]);
        }

        // Fetch gift notifications - check if gifts_received > 0
        // Note: In a production app, you'd want a separate gifts table with gifter info and timestamps
        // For now, we'll show a notification if gifts_received count is > 0
        if (profile?.gifts_received && profile.gifts_received > 0) {
          // Since we don't have individual gift records, show a summary notification
          setGiftNotifications([{
            gifter_id: '',
            gifter_name: null,
            gifter_email: null,
            emoji: '🎁',
            quantity: profile.gifts_received,
            created_at: new Date().toISOString()
          }]);
        } else {
          setGiftNotifications([]);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setNotificationsLoading(false);
      }
    };

    fetchNotifications();
  }, [isOwnProfile, user?.id, profile?.gifts_received]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const profileId = id || user?.id;

        if (!profileId) {
          if (user) {
            navigate("/auth");
          } else {
            navigate("/auth");
          }
          setLoading(false);
          return;
        }

        // Check if this is the user's own profile (no id param means own profile)
        const isViewingOwnProfile = !id && user?.id === profileId;

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", profileId)
          .single();

        if (error) {
          // Handle table not found error
          if (error.code === "PGRST205" || error.message?.includes("Could not find the table")) {
            console.error("Profiles table not found. Please run the migration SQL file.");
            toast.error("Database not set up. Please run the migration SQL in Supabase.");
            setLoading(false);
            return;
          }
          
          // If viewing own profile and it doesn't exist (PGRST116 = no rows returned), create it
          if (isViewingOwnProfile && (error.code === "PGRST116" || error.message?.includes("No rows"))) {
            // Profile doesn't exist, create it
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
            const { data: newProfile, error: insertError } = await supabase
              .from("profiles")
              .insert({
                id: user!.id,
                email: user!.email || "",
                full_name: user!.user_metadata?.full_name || user!.email?.split("@")[0] || "User",
                industry: user!.user_metadata?.industry || null,
                login_streak: 1,
                last_login_date: today,
              })
              .select()
              .single();

            if (insertError) {
              console.error("Error creating profile:", insertError);
              toast.error("Failed to create profile");
              setLoading(false);
              return;
            } else if (newProfile) {
              setProfile(newProfile);
              // Initialize garden data from new profile
              if (newProfile.garden_grid && Array.isArray(newProfile.garden_grid)) {
                const normalizedGrid = newProfile.garden_grid.map((row: any[]) =>
                  row.map((cell: any) => {
                    if (!cell) return null;
                    if (typeof cell === 'string') return { emoji: cell, gifted: false };
                    return cell;
                  })
                );
                setGardenGrid(normalizedGrid);
              }
              if (newProfile.garden_points !== null && newProfile.garden_points !== undefined) {
                setPoints(newProfile.garden_points);
              }
              if (newProfile.gifts_received !== null && newProfile.gifts_received !== undefined) {
                setGiftsReceived(newProfile.gifts_received);
              }
              if (newProfile.inventory && Array.isArray(newProfile.inventory)) {
                // Clean inventory data when loading
                const cleanInventory = newProfile.inventory.map((item: any) => ({
                  emoji: item.emoji,
                  count: typeof item.count === 'number' ? item.count : 1
                }));
                setInventory(cleanInventory);
              }
              setGardenLoading(false);
            }
          } else {
            console.error("Error loading profile:", error);
            toast.error("Failed to load profile");
            setGardenLoading(false);
          }
        } else if (data) {
          setProfile(data);
          
          // Update login streak if viewing own profile
          if (isViewingOwnProfile && user?.id === data.id) {
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
            const lastLoginDate = data.last_login_date;
            let newStreak = data.login_streak || 0;
            
            if (!lastLoginDate) {
              // First login - start streak at 1
              newStreak = 1;
            } else if (lastLoginDate === today) {
              // Already logged in today - don't update streak
              // Do nothing, keep current streak
            } else {
              // Check if last login was yesterday
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              const yesterdayStr = yesterday.toISOString().split('T')[0];
              
              if (lastLoginDate === yesterdayStr) {
                // Consecutive day - increment streak
                newStreak = (data.login_streak || 0) + 1;
              } else {
                // Streak broken - reset to 1
                newStreak = 1;
              }
            }
            
            // Update streak and last login date if needed
            if (lastLoginDate !== today) {
              const { error: streakError } = await supabase
                .from("profiles")
                .update({
                  login_streak: newStreak,
                  last_login_date: today,
                })
                .eq("id", user.id);
              
              if (!streakError) {
                // Update local profile state
                setProfile({
                  ...data,
                  login_streak: newStreak,
                  last_login_date: today,
                });
              }
            }
          }
          
          // Initialize garden data from profile
          if (data.garden_grid && Array.isArray(data.garden_grid)) {
            // Normalize garden grid to handle both old (string) and new (object) formats
            const normalizedGrid = data.garden_grid.map((row: any[]) =>
              row.map((cell: any) => {
                if (!cell) return null;
                if (typeof cell === 'string') return { emoji: cell, gifted: false };
                return cell;
              })
            );
            setGardenGrid(normalizedGrid);
          }
          if (data.garden_points !== null && data.garden_points !== undefined) {
            setPoints(data.garden_points);
          }
          if (data.gifts_received !== null && data.gifts_received !== undefined) {
            setGiftsReceived(data.gifts_received);
          }
          if (data.inventory && Array.isArray(data.inventory)) {
            // Clean inventory data when loading
            const cleanInventory = data.inventory.map((item: any) => ({
              emoji: item.emoji,
              count: typeof item.count === 'number' ? item.count : 1
            }));
            setInventory(cleanInventory);
          }
          setGardenLoading(false);
        } else {
          // No data returned and no error - profile doesn't exist
          if (isViewingOwnProfile && user) {
            // Create profile for own profile view
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
            const { data: newProfile, error: insertError } = await supabase
              .from("profiles")
              .insert({
                id: user.id,
                email: user.email || "",
                full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
                industry: user.user_metadata?.industry || null,
                login_streak: 1,
                last_login_date: today,
              })
              .select()
              .single();

            if (insertError) {
              console.error("Error creating profile:", insertError);
              toast.error("Failed to create profile");
              setGardenLoading(false);
            } else if (newProfile) {
              setProfile(newProfile);
              // Initialize garden data from new profile
              if (newProfile.garden_grid && Array.isArray(newProfile.garden_grid)) {
                setGardenGrid(newProfile.garden_grid as (string | null)[][]);
              }
              if (newProfile.garden_points !== null && newProfile.garden_points !== undefined) {
                setPoints(newProfile.garden_points);
              }
              setGardenLoading(false);
            }
          } else {
            setGardenLoading(false);
          }
        }
      } catch (error) {
        console.error("Error:", error);
        toast.error("An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (user || id) {
      loadProfile();
    } else {
      navigate("/auth");
    }
  }, [id, user, navigate]);

  const startEditing = () => {
    if (profile) {
      setEditData({
        industry: profile.industry || "",
        favorite_food: profile.favorite_food || "",
        favorite_color: profile.favorite_color || "",
        favorite_artist: profile.favorite_artist || "",
        hobbies: profile.hobbies || [],
        motivational_quote: profile.motivational_quote || "",
      });
      setEditing(true);
    }
  };

  const saveProfile = async () => {
    if (!profile || !user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update(editData)
        .eq("id", profile.id);

      if (error) {
        toast.error("Failed to update profile");
        console.error(error);
      } else {
        setProfile({ ...profile, ...editData });
        setEditing(false);
        toast.success("Profile updated!");
      }
    } catch (error) {
      toast.error("An error occurred");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const addHobby = () => {
    if (newHobby.trim()) {
      setEditData((prev) => ({
        ...prev,
        hobbies: [...(prev.hobbies || []), newHobby.trim()],
      }));
      setNewHobby("");
    }
  };

  const removeHobby = (index: number) => {
    setEditData((prev) => ({
      ...prev,
      hobbies: prev.hobbies.filter((_, i) => i !== index),
    }));
  };

  const handleConnect = async () => {
    if (!user) {
      toast.error("Create an account to interact with other users", {
        action: {
          label: "Sign Up",
          onClick: () => navigate("/auth?mode=signup"),
        },
      });
      return;
    }
    
    if (!profileId || isOwnProfile || isConnecting) return;

    setIsConnecting(true);
    try {
      if (isConnected || isPending) {
        // Disconnect - remove the connection from current user to profile
        const { error } = await supabase
          .from("connections")
          .delete()
          .eq("user_id", user.id)
          .eq("connected_user_id", profileId);

        if (error) throw error;
        setIsConnected(false);
        setIsPending(false);
        setHasIncomingRequest(false);
        toast.success("Disconnected");
        // Refresh connections count
        const { data: outgoingConnections } = await supabase
          .from("connections")
          .select("connected_user_id")
          .eq("user_id", profileId);
        const { data: incomingConnections } = await supabase
          .from("connections")
          .select("user_id")
          .eq("connected_user_id", profileId);
        if (outgoingConnections && incomingConnections) {
          const outgoingSet = new Set(outgoingConnections.map(c => c.connected_user_id));
          const incomingSet = new Set(incomingConnections.map(c => c.user_id));
          let mutualCount = 0;
          outgoingSet.forEach(userId => {
            if (incomingSet.has(userId)) mutualCount++;
          });
          setConnectionsCount(mutualCount);
        }
      } else {
        // Connect - create connection from current user to profile
        const { error } = await supabase
          .from("connections")
          .insert({
            user_id: user.id,
            connected_user_id: profileId,
          });

        if (error) throw error;
        
        // Check if mutual connection now exists
        const { data: reverseConnection } = await supabase
          .from("connections")
          .select("id")
          .eq("user_id", profileId)
          .eq("connected_user_id", user.id)
          .single();

        if (reverseConnection) {
          setIsConnected(true);
          setIsPending(false);
          setHasIncomingRequest(false);
          toast.success("Connected!");
        } else {
          setIsPending(true);
          setIsConnected(false);
          setHasIncomingRequest(false);
          toast.success("Connection request sent");
        }
        // Refresh connections count
        const { data: outgoingConnections } = await supabase
          .from("connections")
          .select("connected_user_id")
          .eq("user_id", profileId);
        const { data: incomingConnections } = await supabase
          .from("connections")
          .select("user_id")
          .eq("connected_user_id", profileId);
        if (outgoingConnections && incomingConnections) {
          const outgoingSet = new Set(outgoingConnections.map(c => c.connected_user_id));
          const incomingSet = new Set(incomingConnections.map(c => c.user_id));
          let mutualCount = 0;
          outgoingSet.forEach(userId => {
            if (incomingSet.has(userId)) mutualCount++;
          });
          setConnectionsCount(mutualCount);
        }
      }
    } catch (error) {
      console.error("Error connecting/disconnecting:", error);
      toast.error("Failed to update connection status");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!user || !profileId || isOwnProfile || isConnecting) return;

    setIsConnecting(true);
    try {
      // Accept request by creating connection from current user to profile
      // (profile already has connection to user, so this makes it mutual)
      const { error } = await supabase
        .from("connections")
        .insert({
          user_id: user.id,
          connected_user_id: profileId,
        });

      if (error) throw error;
      
      setIsConnected(true);
      setIsPending(false);
      setHasIncomingRequest(false);
      toast.success("Connection accepted!");
      
      // Refresh connections count
      const { data: outgoingConnections } = await supabase
        .from("connections")
        .select("connected_user_id")
        .eq("user_id", profileId);
      const { data: incomingConnections } = await supabase
        .from("connections")
        .select("user_id")
        .eq("connected_user_id", profileId);
      if (outgoingConnections && incomingConnections) {
        const outgoingSet = new Set(outgoingConnections.map(c => c.connected_user_id));
        const incomingSet = new Set(incomingConnections.map(c => c.user_id));
        let mutualCount = 0;
        outgoingSet.forEach(userId => {
          if (incomingSet.has(userId)) mutualCount++;
        });
        setConnectionsCount(mutualCount);
      }
    } catch (error) {
      console.error("Error accepting connection:", error);
      toast.error("Failed to accept connection");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDeclineRequest = async () => {
    if (!user || !profileId || isOwnProfile || isConnecting) return;

    setIsConnecting(true);
    try {
      // Decline request by removing the connection from profile to current user
      const { error } = await supabase
        .from("connections")
        .delete()
        .eq("user_id", profileId)
        .eq("connected_user_id", user.id);

      if (error) throw error;
      
      setIsConnected(false);
      setIsPending(false);
      setHasIncomingRequest(false);
      toast.success("Connection request declined");
    } catch (error) {
      console.error("Error declining connection:", error);
      toast.error("Failed to decline connection");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleAcceptRequestFromNotification = async (requestUserId: string) => {
    if (!user || isConnecting) return;

    setIsConnecting(true);
    try {
      // Accept request by creating connection from current user to requester
      const { error } = await supabase
        .from("connections")
        .insert({
          user_id: user.id,
          connected_user_id: requestUserId,
        });

      if (error) throw error;
      
      // Remove from notifications
      setConnectionRequests(prev => prev.filter(r => r.user_id !== requestUserId));
      toast.success("Connection accepted!");
      
      // Refresh connections count
      const { data: outgoingConnections } = await supabase
        .from("connections")
        .select("connected_user_id")
        .eq("user_id", user.id);
      const { data: incomingConnections } = await supabase
        .from("connections")
        .select("user_id")
        .eq("connected_user_id", user.id);
      if (outgoingConnections && incomingConnections) {
        const outgoingSet = new Set(outgoingConnections.map(c => c.connected_user_id));
        const incomingSet = new Set(incomingConnections.map(c => c.user_id));
        let mutualCount = 0;
        outgoingSet.forEach(userId => {
          if (incomingSet.has(userId)) mutualCount++;
        });
        setConnectionsCount(mutualCount);
      }
    } catch (error) {
      console.error("Error accepting connection:", error);
      toast.error("Failed to accept connection");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDeclineRequestFromNotification = async (requestUserId: string, connectionId: string) => {
    if (!user || isConnecting) return;

    setIsConnecting(true);
    try {
      // Decline request by removing the connection
      const { error } = await supabase
        .from("connections")
        .delete()
        .eq("id", connectionId);

      if (error) throw error;
      
      // Remove from notifications
      setConnectionRequests(prev => prev.filter(r => r.id !== connectionId));
      toast.success("Connection request declined");
    } catch (error) {
      console.error("Error declining connection:", error);
      toast.error("Failed to decline connection");
    } finally {
      setIsConnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground font-semibold">Loading profile...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!profile && !loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16 flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <p className="font-bold text-xl mb-4">Profile not found</p>
            <p className="text-muted-foreground text-sm">
              If you just set up the database, make sure you've run the migration SQL file in your Supabase dashboard.
            </p>
            <p className="text-muted-foreground text-xs mt-2 font-mono">
              See: supabase/migrations/20240101000000_create_profiles_table.sql
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const firstName = profile.full_name?.split(" ")[0] || profile.email?.split("@")[0] || "User";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Profile Header */}
            <Card className="border-[3px] border-foreground shadow-brutal p-6 md:p-8 mb-8">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl md:text-4xl font-bold">{firstName}</h1>
                    {profile.login_streak !== null && profile.login_streak !== undefined && profile.login_streak > 0 && (
                      <div className="flex items-center gap-1 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 border-[2px] border-orange-500 rounded-md">
                        <Flame className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        <span className="text-sm font-bold text-orange-700 dark:text-orange-300">
                          {profile.login_streak} day{profile.login_streak !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {editing ? (
                    <div className="mt-3 max-w-xs relative">
                      <select
                        value={editData.industry}
                        onChange={(e) => setEditData({ ...editData, industry: e.target.value })}
                        className="flex h-11 w-full bg-cream-warm px-4 py-2 pr-12 text-base font-medium border-[3px] border-foreground transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 appearance-none"
                      >
                        <option value="">Select your industry</option>
                        {industries.map((ind) => (
                          <option key={ind} value={ind}>
                            {ind}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
                    </div>
                  ) : (
                    <p className="text-lg text-primary font-semibold font-mono mt-2">
                      {profile.industry || "Human Being"}
                    </p>
                  )}

                  {/* Connections Count */}
                  <div className="flex gap-4 mt-4">
                    <button
                      className="hover:text-primary transition-colors"
                      onClick={() => {
                        // TODO: Could navigate to a connections list page
                      }}
                    >
                      <span className="font-bold text-lg">{connectionsCount}</span>
                      <span className="text-sm text-muted-foreground ml-1">Connections</span>
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  {isOwnProfile ? (
                    <>
                      {editing ? (
                        <>
                          <Button
                            variant="outline"
                            onClick={() => setEditing(false)}
                            className="border-[3px] border-foreground"
                          >
                            <X className="w-4 h-4 mr-1" /> Cancel
                          </Button>
                          <Button
                            onClick={saveProfile}
                            disabled={saving}
                            className="border-[3px] border-foreground"
                          >
                            {saving ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-1" />
                            ) : (
                              <Save className="w-4 h-4 mr-1" />
                            )}
                            Save
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={startEditing}
                          className="border-[3px] border-foreground"
                        >
                          <Edit2 className="w-4 h-4 mr-1" /> Edit Profile
                        </Button>
                      )}
                    </>
                  ) : (
                    <div className="flex gap-2">
                      {hasIncomingRequest ? (
                        <>
                          <Button
                            onClick={handleAcceptRequest}
                            disabled={isConnecting}
                            className="border-[3px] border-foreground"
                          >
                            {isConnecting ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-1" />
                            ) : (
                              <>
                                <UserPlus className="w-4 h-4 mr-1" /> Accept Request
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={handleDeclineRequest}
                            disabled={isConnecting}
                            variant="outline"
                            className="border-[3px] border-foreground"
                          >
                            Decline
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={handleConnect}
                          disabled={isConnecting}
                          variant={isConnected ? "outline" : "default"}
                          className={`border-[3px] border-foreground ${!user ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          {isConnecting ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-1" />
                          ) : isConnected ? (
                            <>
                              <UserMinus className="w-4 h-4 mr-1" /> Disconnect
                            </>
                          ) : isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-1" /> Pending
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4 mr-1" /> Connect
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Motivational Quote */}
              <div className="mt-6 pt-6 border-t-[3px] border-dashed border-foreground">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center border-[3px] border-foreground">
                    <Quote className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span className="font-bold text-sm uppercase tracking-wide">Favorite Quote</span>
                </div>
                
                {editing ? (
                  <textarea
                    value={editData.motivational_quote}
                    onChange={(e) => setEditData({ ...editData, motivational_quote: e.target.value })}
                    placeholder="What motivates you?"
                    className="flex min-h-[100px] w-full bg-cream-warm px-4 py-2 text-base font-medium border-[3px] border-foreground transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 resize-none"
                  />
                ) : profile.motivational_quote ? (
                  <div className="bg-secondary border-[3px] border-foreground p-4">
                    <p className="font-medium text-lg italic">
                      "{profile.motivational_quote}"
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">No quote added yet</p>
                )}
              </div>

              {/* Hobbies */}
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center border-[3px] border-foreground">
                    <Sparkles className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span className="font-bold text-sm uppercase tracking-wide">Hobbies</span>
                </div>
                
                {editing ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {editData.hobbies?.map((hobby, i) => (
                        <span 
                          key={i}
                          className="bg-primary text-primary-foreground px-4 py-2 font-semibold border-[3px] border-foreground flex items-center gap-2"
                        >
                          {hobby}
                          <button 
                            onClick={() => removeHobby(i)} 
                            className="hover:text-destructive transition-colors"
                            type="button"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2 max-w-xs">
                      <Input
                        value={newHobby}
                        onChange={(e) => setNewHobby(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addHobby())}
                        placeholder="Add hobby..."
                        className="shadow-none"
                      />
                      <Button 
                        onClick={addHobby}
                        className="border-[3px] border-foreground shadow-none"
                        type="button"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {profile.hobbies && profile.hobbies.length > 0 ? (
                      profile.hobbies.map((hobby, i) => (
                        <span 
                          key={i}
                          className="bg-primary text-primary-foreground px-4 py-2 font-semibold border-[3px] border-foreground"
                        >
                          {hobby}
                        </span>
                      ))
                    ) : (
                      <p className="text-muted-foreground italic">No hobbies listed</p>
                    )}
                  </div>
                )}
              </div>

              {/* Favorites */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <div className="flex items-center gap-3 bg-secondary p-4 border-[3px] border-foreground">
                  <UtensilsCrossed className="w-5 h-5 text-primary" />
                  <div className="flex-grow">
                    <span className="font-bold text-xs text-muted-foreground uppercase tracking-wide block">Favorite Food</span>
                    {editing ? (
                      <Input
                        value={editData.favorite_food}
                        onChange={(e) => setEditData({ ...editData, favorite_food: e.target.value })}
                        className="mt-1 h-9 shadow-none"
                      />
                    ) : (
                      <p className="font-semibold mt-1">{profile.favorite_food || "—"}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3 bg-secondary p-4 border-[3px] border-foreground">
                  <Palette className="w-5 h-5 text-primary" />
                  <div className="flex-grow">
                    <span className="font-bold text-xs text-muted-foreground uppercase tracking-wide block">Favorite Color</span>
                    {editing ? (
                      <Input
                        value={editData.favorite_color}
                        onChange={(e) => setEditData({ ...editData, favorite_color: e.target.value })}
                        className="mt-1 h-9 shadow-none"
                      />
                    ) : (
                      <p className="font-semibold mt-1">{profile.favorite_color || "—"}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3 bg-secondary p-4 border-[3px] border-foreground">
                  <Heart className="w-5 h-5 text-primary" />
                  <div className="flex-grow">
                    <span className="font-bold text-xs text-muted-foreground uppercase tracking-wide block">Favorite Artist</span>
                    {editing ? (
                      <Input
                        value={editData.favorite_artist}
                        onChange={(e) => setEditData({ ...editData, favorite_artist: e.target.value })}
                        className="mt-1 h-9 shadow-none"
                      />
                    ) : (
                      <p className="font-semibold mt-1">{profile.favorite_artist || "—"}</p>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Notifications Section - Only show on own profile */}
            {isOwnProfile && (
              <Card className="border-[3px] border-foreground shadow-brutal p-6 md:p-8 mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Bell className="w-5 h-5" />
                  <h2 className="font-bold text-2xl">Notifications</h2>
                </div>
                
                {notificationsLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm">Loading notifications...</p>
                  </div>
                ) : (
                  <Tabs defaultValue="all" className="w-full">
                    <TabsList className="grid w-full grid-cols-5 border-[3px] border-foreground mb-4">
                      <TabsTrigger value="all" className="border-r-[3px] border-foreground last:border-r-0">
                        All ({connectionRequests.length + commentNotifications.length + reactionNotifications.length + giftNotifications.length})
                      </TabsTrigger>
                      <TabsTrigger value="connections" className="border-r-[3px] border-foreground last:border-r-0">
                        Requests ({connectionRequests.length})
                      </TabsTrigger>
                      <TabsTrigger value="comments" className="border-r-[3px] border-foreground last:border-r-0">
                        Comments ({commentNotifications.length})
                      </TabsTrigger>
                      <TabsTrigger value="reactions" className="border-r-[3px] border-foreground last:border-r-0">
                        Reactions ({reactionNotifications.length})
                      </TabsTrigger>
                      <TabsTrigger value="gifts">
                        Gifts ({giftNotifications.length})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="space-y-3">
                      {connectionRequests.length === 0 && commentNotifications.length === 0 && reactionNotifications.length === 0 && giftNotifications.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>No notifications yet</p>
                        </div>
                      ) : (
                        <>
                          {connectionRequests.map((request) => (
                            <div key={request.id} className="p-4 border-[2px] border-foreground rounded-md bg-secondary">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <UserPlus className="w-4 h-4 text-primary" />
                                    <span className="font-semibold">
                                      {request.full_name || request.email?.split("@")[0] || "Someone"}
                                    </span>
                                    <span className="text-sm text-muted-foreground">wants to connect</span>
                                  </div>
                                  {request.industry && (
                                    <p className="text-xs text-primary font-mono mt-1">
                                      {request.industry}
                                    </p>
                                  )}
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleAcceptRequestFromNotification(request.user_id)}
                                    disabled={isConnecting}
                                    className="border-[2px] border-foreground"
                                  >
                                    Accept
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeclineRequestFromNotification(request.user_id, request.id)}
                                    disabled={isConnecting}
                                    className="border-[2px] border-foreground"
                                  >
                                    Decline
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                          {commentNotifications.map((comment) => (
                            <div key={comment.id} className="p-4 border-[2px] border-foreground rounded-md bg-secondary">
                              <div className="flex items-start gap-3">
                                <MessageSquare className="w-4 h-4 text-primary mt-1" />
                                <div className="flex-1">
                                  <p className="text-sm">
                                    <span className="font-semibold">
                                      {comment.author_name || comment.author_email?.split("@")[0] || "Someone"}
                                    </span>
                                    {" "}commented on your post
                                    {comment.post_title && (
                                      <span className="text-muted-foreground"> "{comment.post_title}"</span>
                                    )}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1 italic">"{comment.content}"</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                          {reactionNotifications.map((reaction) => (
                            <div key={reaction.id} className="p-4 border-[2px] border-foreground rounded-md bg-secondary">
                              <div className="flex items-start gap-3">
                                <ThumbsUp className={`w-4 h-4 mt-1 ${reaction.reaction_type === 'like' ? 'text-primary' : 'text-muted-foreground'}`} />
                                <div className="flex-1">
                                  <p className="text-sm">
                                    <span className="font-semibold">
                                      {reaction.user_name || reaction.user_email?.split("@")[0] || "Someone"}
                                    </span>
                                    {" "}{reaction.reaction_type === 'like' ? 'liked' : 'disliked'} your post
                                    {reaction.post_title && (
                                      <span className="text-muted-foreground"> "{reaction.post_title}"</span>
                                    )}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {formatDistanceToNow(new Date(reaction.created_at), { addSuffix: true })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                          {giftNotifications.map((gift, index) => (
                            <div key={index} className="p-4 border-[2px] border-foreground rounded-md bg-secondary">
                              <div className="flex items-start gap-3">
                                <Gift className="w-4 h-4 text-primary mt-1" />
                                <div className="flex-1">
                                  <p className="text-sm">
                                    {gift.gifter_name || gift.gifter_email?.split("@")[0] || "Someone"} 
                                    {" "}gifted you {gift.quantity}x {gift.emoji}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Check your garden to see the gifts!
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </TabsContent>

                    <TabsContent value="connections" className="space-y-3">
                      {connectionRequests.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <UserPlus className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>No connection requests</p>
                        </div>
                      ) : (
                        connectionRequests.map((request) => (
                          <div key={request.id} className="p-4 border-[2px] border-foreground rounded-md bg-secondary">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <UserPlus className="w-4 h-4 text-primary" />
                                  <span className="font-semibold">
                                    {request.full_name || request.email?.split("@")[0] || "Someone"}
                                  </span>
                                  <span className="text-sm text-muted-foreground">wants to connect</span>
                                </div>
                                {request.industry && (
                                  <p className="text-xs text-primary font-mono mt-1">
                                    {request.industry}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleAcceptRequestFromNotification(request.user_id)}
                                  disabled={isConnecting}
                                  className="border-[2px] border-foreground"
                                >
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeclineRequestFromNotification(request.user_id, request.id)}
                                  disabled={isConnecting}
                                  className="border-[2px] border-foreground"
                                >
                                  Decline
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </TabsContent>

                    <TabsContent value="comments" className="space-y-3">
                      {commentNotifications.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>No comments yet</p>
                        </div>
                      ) : (
                        commentNotifications.map((comment) => (
                          <div key={comment.id} className="p-4 border-[2px] border-foreground rounded-md bg-secondary">
                            <div className="flex items-start gap-3">
                              <MessageSquare className="w-4 h-4 text-primary mt-1" />
                              <div className="flex-1">
                                <p className="text-sm">
                                  <span className="font-semibold">
                                    {comment.author_name || comment.author_email?.split("@")[0] || "Someone"}
                                  </span>
                                  {" "}commented on your post
                                  {comment.post_title && (
                                    <span className="text-muted-foreground"> "{comment.post_title}"</span>
                                  )}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1 italic">"{comment.content}"</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </TabsContent>

                    <TabsContent value="reactions" className="space-y-3">
                      {reactionNotifications.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <ThumbsUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>No reactions yet</p>
                        </div>
                      ) : (
                        reactionNotifications.map((reaction) => (
                          <div key={reaction.id} className="p-4 border-[2px] border-foreground rounded-md bg-secondary">
                            <div className="flex items-start gap-3">
                              <ThumbsUp className={`w-4 h-4 mt-1 ${reaction.reaction_type === 'like' ? 'text-primary' : 'text-muted-foreground'}`} />
                              <div className="flex-1">
                                <p className="text-sm">
                                  <span className="font-semibold">
                                    {reaction.user_name || reaction.user_email?.split("@")[0] || "Someone"}
                                  </span>
                                  {" "}{reaction.reaction_type === 'like' ? 'liked' : 'disliked'} your post
                                  {reaction.post_title && (
                                    <span className="text-muted-foreground"> "{reaction.post_title}"</span>
                                  )}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatDistanceToNow(new Date(reaction.created_at), { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </TabsContent>
                    <TabsContent value="gifts" className="space-y-3">
                      {giftNotifications.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Gift className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>No gifts received yet</p>
                        </div>
                      ) : (
                        giftNotifications.map((gift, index) => (
                          <div key={index} className="p-4 border-[2px] border-foreground rounded-md bg-secondary">
                            <div className="flex items-start gap-3">
                              <Gift className="w-4 h-4 text-primary mt-1" />
                              <div className="flex-1">
                                <p className="text-sm">
                                  {gift.gifter_name || gift.gifter_email?.split("@")[0] || "Someone"} 
                                  {" "}gifted you {gift.quantity}x {gift.emoji}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Check your garden to see the gifts!
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </TabsContent>
                  </Tabs>
                )}
              </Card>
            )}

            {/* Posts Section */}
            <div className="mb-8">
              <h2 className="font-bold text-2xl mb-4">
                {isOwnProfile ? "My Failures" : `${firstName}'s Failures`}
              </h2>
              {postsLoading ? (
                <Card className="border-[3px] border-foreground shadow-brutal p-8 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                  <p className="text-muted-foreground">Loading failures...</p>
                </Card>
              ) : userPosts.length === 0 ? (
                <Card className="border-[3px] border-foreground shadow-brutal p-8 text-center">
                  <p className="text-muted-foreground">
                    {isOwnProfile 
                      ? "Your failures will appear here once you start sharing."
                      : "No failures shared yet."}
                  </p>
                </Card>
              ) : (
                <div className="relative overflow-hidden">
                  <Carousel
                    opts={{
                      align: "start",
                      loop: false,
                    }}
                    className="w-full"
                  >
                    <CarouselContent className="-ml-2 md:-ml-4 px-12">
                      {userPosts.map((post) => (
                        <CarouselItem key={post.id} className="pl-2 md:pl-4 basis-full">
                          <FailurePost
                            id={post.id}
                            author={post.author}
                            industry={post.industry}
                            title={post.title}
                            content={post.content}
                            tags={post.tags}
                            timestamp={post.timestamp}
                            reactions={post.reactions}
                            comments={post.comments}
                            size="md"
                            author_id={post.author_id}
                          />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    {userPosts.length > 1 && (
                      <>
                        <CarouselPrevious className="left-0 border-[3px] border-foreground" />
                        <CarouselNext className="right-0 border-[3px] border-foreground" />
                      </>
                    )}
                  </Carousel>
                </div>
              )}
            </div>

            {/* Emoji Garden - Only show if own profile or mutual connection */}
            {isOwnProfile || isConnected ? (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-2xl">
                    {isOwnProfile ? "My Garden" : `${firstName}'s Garden`}
                  </h2>
                <div className="flex items-center gap-4">
                  {isOwnProfile && (
                    <>
                      <div className="flex items-center gap-2 px-4 py-2 bg-secondary border-[3px] border-foreground rounded">
                        <span className="font-bold text-lg">{points}</span>
                        <span className="text-sm text-muted-foreground">points</span>
                      </div>
                      {giftsReceived > 0 && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-secondary border-[3px] border-foreground rounded">
                          <span className="text-lg">🎁</span>
                          <span className="font-bold text-lg">{giftsReceived}</span>
                          <span className="text-sm text-muted-foreground">gifts received</span>
                        </div>
                      )}
                      {selectedVegetable && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedVegetable(null);
                            toast.info("Selection cancelled");
                          }}
                          disabled={gardenLoading}
                          className="border-[3px] border-foreground"
                        >
                          <XIcon className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      )}
                      <Button
                        onClick={() => setShopOpen(true)}
                        disabled={gardenLoading}
                        className="border-[3px] border-foreground"
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Shop
                      </Button>
                      <Button
                        onClick={() => setInventoryOpen(true)}
                        disabled={gardenLoading}
                        variant="outline"
                        className="border-[3px] border-foreground"
                      >
                        <Package className="w-4 h-4 mr-2" />
                        Inventory
                      </Button>
                    </>
                  )}
                </div>
                
                {selectedVegetable && isOwnProfile && (
                  <div className="mb-3 p-3 bg-primary/10 border-[3px] border-primary rounded flex items-center gap-2">
                    <span className="text-2xl">{selectedVegetable}</span>
                    <span className="font-semibold">
                      Selected: {allVegetables.find(v => v.emoji === selectedVegetable)?.name}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Click an empty cell to plant
                    </span>
                  </div>
                )}
              </div>
              
              <Card 
                className="border-[3px] border-foreground shadow-brutal p-4 aspect-[2/1] relative" 
                style={{ backgroundColor: '#46250A' }}
              >
                {gardenLoading ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                      <p className="text-muted-foreground text-sm">Loading garden...</p>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="w-full h-full grid gap-1"
                    style={{ 
                      gridTemplateColumns: 'repeat(8, 1fr)',
                      gridTemplateRows: 'repeat(6, 1fr)'
                    }}
                  >
                    {gardenGrid.map((row, rowIndex) =>
                      row.map((cell, colIndex) => {
                        const cellEmoji = getCellEmoji(cell);
                        const isGifted = isCellGifted(cell);
                        const canPlant = isOwnProfile && !cellEmoji && !gardenLoading && selectedVegetable;
                        const canHarvest = isOwnProfile && cellEmoji && !selectedVegetable && !gardenLoading;
                        const isPopoverOpen = harvestPopoverOpen?.row === rowIndex && harvestPopoverOpen?.col === colIndex;
                        
                        if (canHarvest) {
                          return (
                            <Popover
                              key={`${rowIndex}-${colIndex}`}
                              open={isPopoverOpen}
                              onOpenChange={(open) => {
                                if (!open) setHarvestPopoverOpen(null);
                              }}
                            >
                              <PopoverTrigger asChild>
                                <button
                                  onClick={() => handleCellClick(rowIndex, colIndex)}
                                  className={`
                                    w-full h-full flex items-center justify-center border-2 transition-all relative
                                    ${isGifted
                                      ? 'bg-amber-700 border-amber-500 shadow-[0_0_8px_rgba(251,191,36,0.6)]' 
                                      : 'bg-amber-700 border-amber-600'
                                    }
                                    hover:bg-amber-600 cursor-pointer
                                  `}
                                >
                                  <span className="text-2xl">{cellEmoji}</span>
                                  {isGifted && (
                                    <span className="absolute top-0 right-0 text-xs">✨</span>
                                  )}
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-2 border-[3px] border-foreground shadow-brutal">
                                <div className="flex flex-col gap-2">
                                  <p className="text-sm font-semibold">Harvest {cellEmoji}?</p>
                                  <Button
                                    onClick={() => handleHarvest(rowIndex, colIndex)}
                                    size="sm"
                                    className="border-[3px] border-foreground"
                                  >
                                    Harvest
                                  </Button>
                                </div>
                              </PopoverContent>
                            </Popover>
                          );
                        }
                        
                        return (
                          <button
                            key={`${rowIndex}-${colIndex}`}
                            onClick={() => handleCellClick(rowIndex, colIndex)}
                            disabled={!canPlant}
                            className={`
                              w-full h-full flex items-center justify-center border-2 transition-all relative
                              ${cellEmoji 
                                ? isGifted
                                  ? 'bg-amber-700 border-amber-500 shadow-[0_0_8px_rgba(251,191,36,0.6)]' 
                                  : 'bg-amber-700 border-amber-600'
                                : selectedVegetable && canPlant
                                ? 'bg-amber-900/50 border-dashed border-amber-600 hover:bg-amber-800/50'
                                : 'bg-amber-900/30 border-dashed border-amber-700/50'
                              }
                              ${canPlant ? 'cursor-pointer' : 'cursor-default opacity-75'}
                            `}
                          >
                            {cellEmoji && (
                              <>
                                <span className="text-2xl">{cellEmoji}</span>
                                {isGifted && (
                                  <span className="absolute top-0 right-0 text-xs">✨</span>
                                )}
                              </>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </Card>
              </div>
            ) : (
              <div className="mb-8">
                <Card className="border-[3px] border-foreground shadow-brutal p-8 text-center">
                  <p className="text-muted-foreground">
                    Connect with {firstName} to view their garden.
                  </p>
                </Card>
              </div>
            )}

            {/* Inventory Modal */}
            {isOwnProfile && (
              <Dialog open={inventoryOpen} onOpenChange={(open) => {
                setInventoryOpen(open);
                if (!open) {
                  setVegetableToGift(null);
                  setSelectedFriendForGift(null);
                  setGiftQuantity(1);
                  setInventoryPopoverOpen(null);
                }
              }}>
                <DialogContent className="border-[3px] border-foreground shadow-brutal max-w-2xl bg-[#1a1a1a]">
                  <DialogHeader>
                    <DialogTitle className="text-2xl text-white">Inventory</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Click a vegetable to delete or gift it
                    </DialogDescription>
                  </DialogHeader>

                  {/* Friend Select and Quantity (shown when gifting) */}
                  {vegetableToGift && (() => {
                    const item = inventory.find(i => i.emoji === vegetableToGift);
                    const maxQuantity = item?.count || 1;
                    
                    return (
                      <div className="mb-4 p-4 bg-gray-800 border-[3px] border-foreground rounded space-y-3">
                        <div>
                          <p className="text-sm text-gray-300 mb-2">Gift {vegetableToGift} to:</p>
                          <Select value={selectedFriendForGift || ""} onValueChange={(value) => {
                            setSelectedFriendForGift(value);
                          }}>
                            <SelectTrigger className="border-[3px] border-foreground bg-gray-900 text-white">
                              <SelectValue placeholder="Select a friend..." />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-900 border-[3px] border-foreground">
                              {mutualConnections.length === 0 ? (
                                <div className="p-2 text-sm text-gray-400">No mutual connections</div>
                              ) : (
                                mutualConnections.map((friend) => (
                                  <SelectItem 
                                    key={friend.id} 
                                    value={friend.id}
                                    className="text-white hover:bg-gray-800"
                                  >
                                    {friend.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm text-gray-300 mb-2 block">Quantity:</label>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setGiftQuantity(Math.max(1, giftQuantity - 1))}
                              disabled={giftQuantity <= 1}
                              className="border-[3px] border-foreground"
                            >
                              -
                            </Button>
                            <Input
                              type="number"
                              min={1}
                              max={maxQuantity}
                              value={giftQuantity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 1;
                                setGiftQuantity(Math.max(1, Math.min(maxQuantity, val)));
                              }}
                              className="w-20 text-center border-[3px] border-foreground bg-gray-900 text-white"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setGiftQuantity(Math.min(maxQuantity, giftQuantity + 1))}
                              disabled={giftQuantity >= maxQuantity}
                              className="border-[3px] border-foreground"
                            >
                              +
                            </Button>
                            <span className="text-sm text-gray-400 ml-2">(max: {maxQuantity})</span>
                          </div>
                        </div>
                        {selectedFriendForGift && vegetableToGift && (
                          <div className="mt-3">
                            <Button
                              onClick={() => {
                                if (selectedFriendForGift && vegetableToGift) {
                                  handleGiftFromInventory(vegetableToGift, selectedFriendForGift, giftQuantity);
                                }
                              }}
                              className="w-full border-[3px] border-foreground"
                            >
                              <Gift className="w-4 h-4 mr-2" />
                              Send Gift
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  <div className="mt-4 p-4 bg-[#1a1a1a]">
                    <div 
                      className="grid gap-2"
                      style={{ 
                        gridTemplateColumns: 'repeat(8, 1fr)',
                        gridTemplateRows: 'repeat(4, 1fr)'
                      }}
                    >
                      {Array.from({ length: 32 }).map((_, index) => {
                        // Inventory is stored as a dense array, so we need to map items to slots
                        // For simplicity, show items in order up to 32 slots
                        const item = index < inventory.length ? inventory[index] : null;
                        const isPopoverOpen = inventoryPopoverOpen === index;
                        
                        if (!item) {
                          return (
                            <div
                              key={index}
                              className="aspect-square border-2 bg-gray-950 border-gray-800 border-t-gray-900 border-l-gray-900 border-b-gray-700 border-r-gray-700 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
                            />
                          );
                        }
                        
                        return (
                          <Popover
                            key={index}
                            open={isPopoverOpen}
                            onOpenChange={(open) => {
                              if (!open) {
                                setInventoryPopoverOpen(null);
                                setVegetableToGift(null);
                                setSelectedFriendForGift(null);
                                setGiftQuantity(1);
                              } else {
                                setInventoryPopoverOpen(index);
                              }
                            }}
                          >
                            <PopoverTrigger asChild>
                              <button
                                className="aspect-square border-2 flex items-center justify-center relative transition-all bg-gray-800 border-gray-600 border-t-gray-500 border-l-gray-500 border-b-gray-700 border-r-gray-700 hover:bg-gray-700 cursor-pointer shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
                              >
                                <span className="text-2xl">{item.emoji}</span>
                                {item.count > 1 && (
                                  <span className="absolute bottom-0 right-0 bg-gray-900 text-white text-xs font-bold px-1 rounded border border-gray-700">
                                    {item.count}
                                  </span>
                                )}
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-2 border-[3px] border-foreground shadow-brutal bg-gray-900">
                              <div className="flex flex-col gap-2">
                                <p className="text-sm font-semibold text-white mb-1">{item.emoji} (x{item.count})</p>
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => {
                                      setVegetableToGift(item.emoji);
                                      setGiftQuantity(1);
                                      setSelectedFriendForGift(null);
                                      setInventoryPopoverOpen(null);
                                    }}
                                    size="sm"
                                    className="border-[3px] border-foreground flex-1"
                                  >
                                    <Gift className="w-3 h-3 mr-1" />
                                    Gift
                                  </Button>
                                  <Button
                                    onClick={() => handleDeleteFromInventory(item.emoji)}
                                    size="sm"
                                    variant="destructive"
                                    className="border-[3px] border-foreground"
                                  >
                                    <Trash2 className="w-3 h-3 mr-1" />
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        );
                      })}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            
            {/* Shop Dialog */}
            {isOwnProfile && (
              <Dialog open={shopOpen} onOpenChange={(open) => {
                setShopOpen(open);
                if (!open) {
                  setGiftMode(false);
                  setSelectedVegetable(null);
                }
              }}>
                <DialogContent className="border-[3px] border-foreground shadow-brutal max-w-5xl w-[90vw] max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-2xl">
                      {giftMode ? `Gift to ${firstName}` : "Garden Shop"}
                    </DialogTitle>
                    <DialogDescription>
                      {giftMode 
                        ? `Select a vegetable to gift. You'll need to check your points when placing.`
                        : `Select a vegetable to plant in your garden. You have ${points} points.`
                      }
                    </DialogDescription>
                  </DialogHeader>
                  <Tabs defaultValue="fruits" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 border-[3px] border-foreground">
                      <TabsTrigger value="fruits" className="border-r-[3px] border-foreground last:border-r-0">
                        🍎 Fruits ({fruits.length})
                      </TabsTrigger>
                      <TabsTrigger value="vegetables" className="border-r-[3px] border-foreground last:border-r-0">
                        🥕 Vegetables ({vegetables.length})
                      </TabsTrigger>
                      <TabsTrigger value="flowers" className="border-r-[3px] border-foreground last:border-r-0">
                        🌸 Flowers ({flowers.length})
                      </TabsTrigger>
                      <TabsTrigger value="plants">
                        🌲 Plants ({plants.length})
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="fruits" className="mt-4">
                      <div className="grid grid-cols-4 md:grid-cols-5 gap-3">
                        {fruits.map((veg) => (
                          <button
                            key={veg.emoji}
                            onClick={() => handleVegetableSelect(veg.emoji, veg.cost)}
                            className={`
                              p-3 border-[3px] border-foreground rounded transition-all
                              ${!giftMode && points < veg.cost
                                ? 'bg-muted opacity-50 cursor-not-allowed'
                                : 'bg-secondary hover:bg-primary hover:text-primary-foreground cursor-pointer'
                              }
                            `}
                          >
                            <div className="text-3xl mb-1">{veg.emoji}</div>
                            <div className="font-bold text-xs">{veg.name}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {veg.cost} pts
                            </div>
                          </button>
                        ))}
                      </div>
                    </TabsContent>
                    <TabsContent value="vegetables" className="mt-4">
                      <div className="grid grid-cols-4 md:grid-cols-5 gap-3">
                        {vegetables.map((veg) => (
                          <button
                            key={veg.emoji}
                            onClick={() => handleVegetableSelect(veg.emoji, veg.cost)}
                            className={`
                              p-3 border-[3px] border-foreground rounded transition-all
                              ${!giftMode && points < veg.cost
                                ? 'bg-muted opacity-50 cursor-not-allowed'
                                : 'bg-secondary hover:bg-primary hover:text-primary-foreground cursor-pointer'
                              }
                            `}
                          >
                            <div className="text-3xl mb-1">{veg.emoji}</div>
                            <div className="font-bold text-xs">{veg.name}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {veg.cost} pts
                            </div>
                          </button>
                        ))}
                      </div>
                    </TabsContent>
                    <TabsContent value="flowers" className="mt-4">
                      <div className="grid grid-cols-4 md:grid-cols-5 gap-3">
                        {flowers.map((veg) => (
                          <button
                            key={veg.emoji}
                            onClick={() => handleVegetableSelect(veg.emoji, veg.cost)}
                            className={`
                              p-3 border-[3px] border-foreground rounded transition-all
                              ${!giftMode && points < veg.cost
                                ? 'bg-muted opacity-50 cursor-not-allowed'
                                : 'bg-secondary hover:bg-primary hover:text-primary-foreground cursor-pointer'
                              }
                            `}
                          >
                            <div className="text-3xl mb-1">{veg.emoji}</div>
                            <div className="font-bold text-xs">{veg.name}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {veg.cost} pts
                            </div>
                          </button>
                        ))}
                      </div>
                    </TabsContent>
                    <TabsContent value="plants" className="mt-4">
                      <div className="grid grid-cols-4 md:grid-cols-5 gap-3">
                        {plants.map((veg) => (
                          <button
                            key={veg.emoji}
                            onClick={() => handleVegetableSelect(veg.emoji, veg.cost)}
                            className={`
                              p-3 border-[3px] border-foreground rounded transition-all
                              ${!giftMode && points < veg.cost
                                ? 'bg-muted opacity-50 cursor-not-allowed'
                                : 'bg-secondary hover:bg-primary hover:text-primary-foreground cursor-pointer'
                              }
                            `}
                          >
                            <div className="text-3xl mb-1">{veg.emoji}</div>
                            <div className="font-bold text-xs">{veg.name}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {veg.cost} pts
                            </div>
                          </button>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Profile;