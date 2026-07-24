import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  Building2,
  Star,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Loader2,
  User,
  Globe,
  MapPin,
  DollarSign,
  Tag,
  X,
  Handshake,
  Target,
  CheckCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useOrganization } from "@/hooks/useOrganization";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { HelpSystem } from "./HelpSystem";

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company: string;
  title: string;
  source: string;
  status: string;
  score: number;
  notes: string;
  created_at: string;
}

interface LeadFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company: string;
  title: string;
  industry: string;
  website: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  source: string;
  status: string;
  expected_value: string;
  preferred_contact_method: string;
  tags: string[];
  notes: string;
  assigned_to: string;
}

const STATUS_OPTIONS = ['new', 'contacted', 'qualified', 'converted', 'lost'];
const SOURCE_OPTIONS = ['website', 'referral', 'social_media', 'cold_call', 'event', 'advertisement'];

const statusColors = {
  new: "bg-blue-50 text-blue-700 border-blue-200",
  contacted: "bg-yellow-50 text-yellow-700 border-yellow-200", 
  qualified: "bg-green-50 text-green-700 border-green-200",
  converted: "bg-purple-50 text-purple-700 border-purple-200",
  lost: "bg-red-50 text-red-700 border-red-200"
};

export function LeadsManagement() {
  const { organization } = useOrganization();
  const { user, profile } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  
  const [formData, setFormData] = useState<LeadFormData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    company: "",
    title: "",
    industry: "",
    website: "",
    street: "",
    city: "",
    state: "",
    country: "",
    postal_code: "",
    source: "",
    status: "",
    expected_value: "",
    preferred_contact_method: "",
    tags: [],
    notes: "",
    assigned_to: ""
  });

  const fetchLeads = useCallback(async () => {
    if (!organization?.id) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setLeads(data || []);
      setFilteredLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({
        title: "Error",
        description: "Failed to fetch leads",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [organization?.id, toast]);

  useEffect(() => {
    if (organization?.id) {
      fetchLeads();
    }
  }, [fetchLeads, organization?.id]);

  useEffect(() => {
    let filtered = leads;

    if (searchTerm) {
      filtered = filtered.filter(lead => 
        lead.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }

    if (sourceFilter !== "all") {
      filtered = filtered.filter(lead => lead.source === sourceFilter);
    }

    setFilteredLeads(filtered);
  }, [leads, searchTerm, statusFilter, sourceFilter]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-destructive";
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.first_name.trim()) newErrors.first_name = "First name is required";
    if (!formData.last_name.trim()) newErrors.last_name = "Last name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Valid email is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    if (!organization || !profile) {
      toast({
        title: "Error",
        description: "Organization or profile not loaded. Please refresh the page.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const dbLeadData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        title: formData.title,
        source: (formData.source || 'website').toLowerCase().trim().replace(/\s+/g, '_'),
        status: (formData.status || 'new').toLowerCase().trim().replace(/\s+/g, '_'),
        notes: formData.notes,
        organization_id: organization?.id,
        created_by: profile?.id,
        score: Math.floor(Math.random() * 40) + 60
      };

      const { data, error } = await supabase
        .from('leads')
        .insert([dbLeadData])
        .select()
        .single();

      if (error) throw error;

      console.log("Lead created successfully:", data);

      toast({
        title: "Success",
        description: "Lead created successfully",
      });

      setIsDialogOpen(false);
      setFormData({
        first_name: "", last_name: "", email: "", phone: "", company: "",
        title: "", industry: "", website: "", street: "", city: "", state: "",
        country: "", postal_code: "", source: "", status: "", expected_value: "",
        preferred_contact_method: "", tags: [], notes: "", assigned_to: ""
      });
      setErrors({});
      fetchLeads();
      
    } catch (error) {
      console.error('Error creating lead:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create lead",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (leadId: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Lead deleted successfully",
      });
      fetchLeads();
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast({
        title: "Error",
        description: "Failed to delete lead",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const LeadCard = ({ lead, onDelete }: { lead: Lead; onDelete?: (leadId: string) => Promise<void> }) => (
    <Card className="hover:shadow-medium transition-smooth">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base sm:text-lg text-foreground truncate">
              {lead.first_name} {lead.last_name}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">{lead.title}</p>
            <div className="flex items-center gap-1 mt-1">
              <Building2 className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-foreground truncate">{lead.company}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 ml-2">
            <Badge className={`${statusColors[lead.status as keyof typeof statusColors]} text-xs px-2 py-1`}>
              {lead.status}
            </Badge>
            <Button variant="ghost" size="sm" className="p-1 sm:p-2">
              <MoreHorizontal className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2 mb-3 sm:mb-4">
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
            <span className="text-foreground truncate">{lead.email}</span>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
            <span className="text-foreground truncate">{lead.phone}</span>
          </div>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Star className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
            <span className={`font-medium text-xs sm:text-sm ${getScoreColor(lead.score)}`}>
              {lead.score}/100
            </span>
          </div>
          <div className="flex gap-1 sm:gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs px-2 py-1 sm:px-3 sm:py-2"
              onClick={() => setViewingLead(lead)}
            >
              <Eye className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
              <span className="hidden sm:inline">View</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs px-2 py-1 sm:px-3 sm:py-2"
              onClick={() => {
                setEditingLead(lead);
                setFormData({
                  first_name: lead.first_name,
                  last_name: lead.last_name,
                  email: lead.email,
                  phone: lead.phone,
                  company: lead.company,
                  title: lead.title,
                  industry: "",
                  website: "",
                  street: "",
                  city: "",
                  state: "",
                  country: "",
                  postal_code: "",
                  source: lead.source,
                  status: lead.status,
                  expected_value: "",
                  preferred_contact_method: "",
                  tags: [],
                  notes: lead.notes,
                  assigned_to: ""
                });
              }}
            >
              <Edit className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleDelete(lead.id)}
              className="text-destructive hover:text-destructive text-xs px-2 py-1 sm:px-3 sm:py-2"
            >
              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
              <span className="hidden sm:inline">Delete</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t('leads.title')}</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage and track your sales leads</p>
          </div>
          <HelpSystem feature="leads" />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary-hover w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Add New Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Create New Lead</DialogTitle>
              <DialogDescription className="text-sm">
                Add a new lead to your CRM system
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="font-medium text-sm">Basic Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm font-medium">First Name *</Label>
                      <Input 
                        id="firstName" 
                        placeholder="Ahmed"
                        value={formData.first_name}
                        onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                        className={`text-sm ${errors.first_name ? "border-red-500" : ""}`}
                      />
                      {errors.first_name && <p className="text-xs text-red-500">{errors.first_name}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm font-medium">Last Name *</Label>
                      <Input 
                        id="lastName" 
                        placeholder="Youssef"
                        value={formData.last_name}
                        onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                        className={`text-sm ${errors.last_name ? "border-red-500" : ""}`}
                      />
                      {errors.last_name && <p className="text-xs text-red-500">{errors.last_name}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">Email *</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="ahmed@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className={`text-sm ${errors.email ? "border-red-500" : ""}`}
                      />
                      {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium">Phone *</Label>
                      <Input 
                        id="phone" 
                        placeholder="+20123456789"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className={`text-sm ${errors.phone ? "border-red-500" : ""}`}
                      />
                      {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                    </div>
                  </div>
                </div>

                {/* Lead Details */}
                <div className="space-y-4">
                  <h3 className="font-medium text-sm">Lead Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company" className="text-sm font-medium">Company</Label>
                      <Input 
                        id="company" 
                        placeholder="Techify Solutions"
                        value={formData.company}
                        onChange={(e) => setFormData({...formData, company: e.target.value})}
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-sm font-medium">Job Title</Label>
                      <Input 
                        id="title" 
                        placeholder="CTO"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        className="text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="source" className="text-sm font-medium">Lead Source</Label>
                      <Select value={formData.source} onValueChange={(value) => setFormData({...formData, source: value})}>
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                        <SelectContent>
                          {SOURCE_OPTIONS.map(source => (
                            <SelectItem key={source} value={source} className="text-sm">
                              {source.replace('_', ' ').charAt(0).toUpperCase() + source.replace('_', ' ').slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                      <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map(status => (
                            <SelectItem key={status} value={status} className="text-sm">
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Extra Info */}
                <div className="space-y-4">
                  <h3 className="font-medium text-sm">Additional Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="industry" className="text-sm font-medium">Industry</Label>
                      <Input 
                        id="industry" 
                        placeholder="Software"
                        value={formData.industry}
                        onChange={(e) => setFormData({...formData, industry: e.target.value})}
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expected_value" className="text-sm font-medium">Expected Value</Label>
                      <Input 
                        id="expected_value" 
                        type="number"
                        placeholder="20000"
                        value={formData.expected_value}
                        onChange={(e) => setFormData({...formData, expected_value: e.target.value})}
                        className="text-sm"
                      />
                    </div>
                  </div>
                  
                  {/* Tags */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Tags</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add tag"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-1 text-sm"
                      />
                      <Button type="button" onClick={addTag} variant="outline" size="sm">
                        Add
                      </Button>
                    </div>
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1 text-xs">
                            {tag}
                            <X className="w-3 h-3 cursor-pointer" onClick={() => removeTag(tag)} />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
                    <Textarea 
                      id="notes" 
                      placeholder="Additional notes about the lead"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className="text-sm min-h-[80px]"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto text-sm"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-primary hover:bg-primary-hover w-full sm:w-auto text-sm"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Lead"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Leads</p>
              <p className="text-2xl font-bold text-foreground">{leads.length}</p>
            </div>
            <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Handshake className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Average Score</p>
              <p className="text-2xl font-bold text-foreground">
                {leads.length > 0 ? Math.round(leads.reduce((sum, lead) => sum + lead.score, 0) / leads.length) : 0}
              </p>
            </div>
            <div className="h-12 w-12 bg-yellow-50 rounded-lg flex items-center justify-center">
              <Target className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Converted</p>
              <p className="text-2xl font-bold text-foreground">
                {leads.filter(lead => lead.status === 'converted').length}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-card rounded-lg border border-border p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                type="text"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            >
              <option value="all">All Status</option>
              {STATUS_OPTIONS.map(status => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
            
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            >
              <option value="all">All Sources</option>
              {SOURCE_OPTIONS.map(source => (
                <option key={source} value={source}>
                  {source.replace('_', ' ').charAt(0).toUpperCase() + source.replace('_', ' ').slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Leads Grid */}
      {filteredLeads.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLeads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onDelete={handleDelete} />
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border p-12 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Handshake className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No leads found</h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm || statusFilter !== 'all' || sourceFilter !== 'all'
              ? "Try adjusting your search or filters"
              : "Get started by creating your first lead"}
          </p>
          {!searchTerm && statusFilter === 'all' && sourceFilter === 'all' && (
            <button
              onClick={() => setIsDialogOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg inline-flex items-center gap-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Lead
            </button>
          )}
        </div>
      )}

      {/* View Lead Dialog */}
      <Dialog open={!!viewingLead} onOpenChange={() => setViewingLead(null)}>
        <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {viewingLead?.first_name} {viewingLead?.last_name}
            </DialogTitle>
            <DialogDescription className="text-sm">
              Lead Details
            </DialogDescription>
          </DialogHeader>
          {viewingLead && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm text-muted-foreground">{viewingLead.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Phone</Label>
                  <p className="text-sm text-muted-foreground">{viewingLead.phone}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Company</Label>
                  <p className="text-sm text-muted-foreground">{viewingLead.company}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Title</Label>
                  <p className="text-sm text-muted-foreground">{viewingLead.title}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Source</Label>
                  <p className="text-sm text-muted-foreground">{viewingLead.source}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge className={`${statusColors[viewingLead.status as keyof typeof statusColors]} text-xs`}>
                    {viewingLead.status}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Score</Label>
                <p className={`text-sm font-medium ${getScoreColor(viewingLead.score)}`}>
                  {viewingLead.score}/100
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Notes</Label>
                <p className="text-sm text-muted-foreground">{viewingLead.notes || 'No notes available'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Created</Label>
                <p className="text-sm text-muted-foreground">{formatDate(viewingLead.created_at)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Lead Dialog */}
      <Dialog open={!!editingLead} onOpenChange={() => setEditingLead(null)}>
        <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Edit Lead</DialogTitle>
            <DialogDescription className="text-sm">
              Update lead information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (!editingLead) return;
            
            try {
              setIsSubmitting(true);
              const { error } = await supabase
                .from('leads')
                .update({
                  first_name: formData.first_name,
                  last_name: formData.last_name,
                  email: formData.email,
                  phone: formData.phone,
                  company: formData.company,
                  title: formData.title,
                  source: formData.source,
                  status: formData.status,
                  notes: formData.notes
                })
                .eq('id', editingLead.id);

              if (error) throw error;

              toast({
                title: "Success",
                description: "Lead updated successfully",
              });

              setEditingLead(null);
              fetchLeads();
            } catch (error) {
              toast({
                title: "Error",
                description: "Failed to update lead",
                variant: "destructive"
              });
            } finally {
              setIsSubmitting(false);
            }
          }}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-firstName" className="text-sm font-medium">First Name *</Label>
                  <Input 
                    id="edit-firstName" 
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-lastName" className="text-sm font-medium">Last Name *</Label>
                  <Input 
                    id="edit-lastName" 
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    className="text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-email" className="text-sm font-medium">Email *</Label>
                  <Input 
                    id="edit-email" 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone" className="text-sm font-medium">Phone *</Label>
                  <Input 
                    id="edit-phone" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-company" className="text-sm font-medium">Company</Label>
                  <Input 
                    id="edit-company" 
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-title" className="text-sm font-medium">Job Title</Label>
                  <Input 
                    id="edit-title" 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-notes" className="text-sm font-medium">Notes</Label>
                <Textarea 
                  id="edit-notes" 
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="text-sm min-h-[80px]"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setEditingLead(null)}
                disabled={isSubmitting}
                className="w-full sm:w-auto text-sm"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-primary hover:bg-primary-hover w-full sm:w-auto text-sm"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Lead"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}