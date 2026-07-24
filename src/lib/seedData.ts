import { supabase } from '@/integrations/supabase/client';

export interface SeedDataOptions {
  organizationId: string;
  organizationName: string;
  userId: string;
}

export const seedOrganizationData = async ({ organizationId, organizationName, userId }: SeedDataOptions) => {
  try {
    // Get actual profile ID from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    const profileId = profile?.id || null;
    
    // Skip seed data if no profile exists
    // Use null if profile doesn't exist (like other functions do)
    // if (!profileId) {
    //   throw new Error('Profile not found. Please ensure your profile exists before seeding data.');
    // }
    const actualUserId = userId; // Use actual auth user ID for foreign keys to users table
    
    // 1. Create Accounts (10 accounts)
    const accounts = await createAccounts(organizationId, profileId);
    
    // 2. Create Leads (15 leads)
    const leads = await createLeads(organizationId, profileId, accounts);
    
    // 3. Create Deals (12 deals)
    const deals = await createDeals(organizationId, profileId, accounts, leads);
    
    // 4. Create Projects (8 projects)
    const projects = await createProjects(organizationId, profileId, accounts);
    
    // 5. Create Invoices (6 invoices)
    const invoices = await createInvoices(organizationId, profileId, accounts);
    
    // 6. Create Content Plans (10 content plans)
    const contentPlans = await createContentPlans(organizationId, profileId, accounts);
    
    return {
      accounts: accounts.length,
      leads: leads.length,
      deals: deals.length,
      projects: projects.length,
      invoices: invoices.length,
      contentPlans: contentPlans.length
    };
  } catch (error) {
    console.error('Error seeding data:', error);
    throw error;
  }
};

const createAccounts = async (organizationId: string, profileId: string) => {
  const accountsData = [
    { name: 'TechCorp Solutions', industry: 'technology', website: 'https://techcorp.com', phone: '+20 2 1234 5678', email: 'contact@techcorp.com', city: 'Cairo', country: 'Egypt' },
    { name: 'Fashion Forward', industry: 'fashion', website: 'https://fashionforward.com', phone: '+20 2 2345 6789', email: 'info@fashionforward.com', city: 'Alexandria', country: 'Egypt' },
    { name: 'BuildRight Construction', industry: 'construction', website: 'https://buildright.com', phone: '+20 2 3456 7890', email: 'projects@buildright.com', city: 'Giza', country: 'Egypt' },
    { name: 'Hospitality Plus', industry: 'hospitality', website: 'https://hospitalityplus.com', phone: '+20 2 4567 8901', email: 'bookings@hospitalityplus.com', city: 'Sharm El Sheikh', country: 'Egypt' },
    { name: 'RetailMax', industry: 'retail', website: 'https://retailmax.com', phone: '+20 2 5678 9012', email: 'sales@retailmax.com', city: 'Hurghada', country: 'Egypt' },
    { name: 'HealthCare First', industry: 'healthcare', website: 'https://healthcarefirst.com', phone: '+20 2 6789 0123', email: 'admin@healthcarefirst.com', city: 'Luxor', country: 'Egypt' },
    { name: 'FinanceWise', industry: 'finance', website: 'https://financewise.com', phone: '+20 2 7890 1234', email: 'support@financewise.com', city: 'Aswan', country: 'Egypt' },
    { name: 'EduTech Academy', industry: 'education', website: 'https://edutech.com', phone: '+20 2 8901 2345', email: 'admissions@edutech.com', city: 'Mansoura', country: 'Egypt' },
    { name: 'Manufacturing Pro', industry: 'manufacturing', website: 'https://manufacturingpro.com', phone: '+20 2 9012 3456', email: 'orders@manufacturingpro.com', city: 'Tanta', country: 'Egypt' },
    { name: 'Global Services', industry: 'other', website: 'https://globalservices.com', phone: '+20 2 0123 4567', email: 'contact@globalservices.com', city: 'Ismailia', country: 'Egypt' }
  ];

  const { data: accounts, error } = await supabase
    .from('accounts')
    .insert(accountsData.map(account => ({
      ...account,
      organization_id: organizationId,
      assigned_to: profileId,
      description: `${account.name} is a leading company in the ${account.industry} sector.`
    })))
    .select();

  if (error) throw error;
  return accounts || [];
};

const createLeads = async (organizationId: string, profileId: string, accounts: any[]) => {
  const leadsData = [
    { first_name: 'Ahmed', last_name: 'Hassan', email: 'ahmed.hassan@email.com', phone: '+20 10 1111 1111', company: 'Tech Innovations', job_title: 'CTO', source: 'website' },
    { first_name: 'Fatima', last_name: 'Ali', email: 'fatima.ali@email.com', phone: '+20 10 2222 2222', company: 'Digital Solutions', job_title: 'Marketing Director', source: 'referral' },
    { first_name: 'Omar', last_name: 'Mohamed', email: 'omar.mohamed@email.com', phone: '+20 10 3333 3333', company: 'Smart Systems', job_title: 'CEO', source: 'social_media' },
    { first_name: 'Nour', last_name: 'Ibrahim', email: 'nour.ibrahim@email.com', phone: '+20 10 4444 4444', company: 'Future Tech', job_title: 'Product Manager', source: 'cold_call' },
    { first_name: 'Khaled', last_name: 'Mahmoud', email: 'khaled.mahmoud@email.com', phone: '+20 10 5555 5555', company: 'Innovation Hub', job_title: 'Sales Director', source: 'event' },
    { first_name: 'Yasmin', last_name: 'Ahmed', email: 'yasmin.ahmed@email.com', phone: '+20 10 6666 6666', company: 'Creative Agency', job_title: 'Creative Director', source: 'advertisement' },
    { first_name: 'Mostafa', last_name: 'Saeed', email: 'mostafa.saeed@email.com', phone: '+20 10 7777 7777', company: 'Business Solutions', job_title: 'Operations Manager', source: 'website' },
    { first_name: 'Rana', last_name: 'Farouk', email: 'rana.farouk@email.com', phone: '+20 10 8888 8888', company: 'Growth Partners', job_title: 'Business Development', source: 'referral' },
    { first_name: 'Tarek', last_name: 'Nasser', email: 'tarek.nasser@email.com', phone: '+20 10 9999 9999', company: 'Strategic Consulting', job_title: 'Senior Consultant', source: 'social_media' },
    { first_name: 'Dina', last_name: 'Rashad', email: 'dina.rashad@email.com', phone: '+20 11 1111 1111', company: 'Market Leaders', job_title: 'VP Sales', source: 'cold_call' },
    { first_name: 'Amr', last_name: 'Hosny', email: 'amr.hosny@email.com', phone: '+20 11 2222 2222', company: 'Tech Pioneers', job_title: 'Technical Lead', source: 'event' },
    { first_name: 'Salma', last_name: 'Kamal', email: 'salma.kamal@email.com', phone: '+20 11 3333 3333', company: 'Digital Transformation', job_title: 'Project Manager', source: 'advertisement' },
    { first_name: 'Hany', last_name: 'Fouad', email: 'hany.fouad@email.com', phone: '+20 11 4444 4444', company: 'Enterprise Solutions', job_title: 'Account Manager', source: 'website' },
    { first_name: 'Mona', last_name: 'Zaki', email: 'mona.zaki@email.com', phone: '+20 11 5555 5555', company: 'Innovation Labs', job_title: 'Research Director', source: 'referral' },
    { first_name: 'Youssef', last_name: 'Adel', email: 'youssef.adel@email.com', phone: '+20 11 6666 6666', company: 'Future Ventures', job_title: 'Investment Manager', source: 'social_media' }
  ];

  const statuses = ['new', 'contacted', 'qualified', 'converted', 'lost'];
  
  const { data: leads, error } = await supabase
    .from('leads')
    .insert(leadsData.map((lead, index) => ({
      ...lead,
      organization_id: organizationId,
      assigned_to: profileId,
      status: statuses[index % statuses.length],
      notes: `Lead from ${lead.company} - ${lead.job_title} interested in our services.`
    })))
    .select();

  if (error) throw error;
  return leads || [];
};

const createDeals = async (organizationId: string, profileId: string, accounts: any[], leads: any[]) => {
  const dealsData = [
    { name: 'CRM Implementation Project', value: 50000, probability: 80, stage: 'negotiation' },
    { name: 'Digital Marketing Campaign', value: 25000, probability: 60, stage: 'proposal' },
    { name: 'Website Development', value: 15000, probability: 90, stage: 'closed_won' },
    { name: 'Mobile App Development', value: 40000, probability: 70, stage: 'negotiation' },
    { name: 'Cloud Migration Services', value: 35000, probability: 50, stage: 'lead' },
    { name: 'Data Analytics Platform', value: 60000, probability: 85, stage: 'negotiation' },
    { name: 'E-commerce Solution', value: 30000, probability: 75, stage: 'proposal' },
    { name: 'Security Audit Services', value: 20000, probability: 95, stage: 'closed_won' },
    { name: 'Training and Consulting', value: 18000, probability: 40, stage: 'lead' },
    { name: 'System Integration', value: 45000, probability: 65, stage: 'proposal' },
    { name: 'Business Intelligence', value: 55000, probability: 30, stage: 'lead' },
    { name: 'Custom Software Development', value: 70000, probability: 20, stage: 'closed_lost' }
  ];

  const { data: deals, error } = await supabase
    .from('deals')
    .insert(dealsData.map((deal, index) => ({
      ...deal,
      organization_id: organizationId,
      assigned_to: profileId,
      account_id: accounts[index % accounts.length]?.id,
      lead_id: leads[index % leads.length]?.id,
      currency: 'EGP',
      expected_close_date: new Date(Date.now() + (Math.random() * 90 + 30) * 24 * 60 * 60 * 1000).toISOString(),
      actual_close_date: deal.stage === 'closed_won' || deal.stage === 'closed_lost' ? new Date().toISOString() : null,
      notes: `Deal for ${deal.name} with potential value of ${deal.value} EGP`
    })))
    .select();

  if (error) throw error;
  return deals || [];
};

const createProjects = async (organizationId: string, profileId: string, accounts: any[]) => {
  const projectsData = [
    { name: 'Website Redesign', description: 'Complete website redesign and development', status: 'in_progress', priority: 'high', budget: 80000, progress: 65 },
    { name: 'Mobile App Launch', description: 'Development and launch of mobile application', status: 'planning', priority: 'high', budget: 120000, progress: 25 },
    { name: 'Marketing Campaign Q1', description: 'Quarterly marketing campaign execution', status: 'completed', priority: 'medium', budget: 45000, progress: 100 },
    { name: 'System Upgrade', description: 'Legacy system upgrade and migration', status: 'in_progress', priority: 'high', budget: 95000, progress: 40 },
    { name: 'Training Program', description: 'Employee training and development program', status: 'planning', priority: 'low', budget: 25000, progress: 10 },
    { name: 'Security Enhancement', description: 'Security infrastructure improvement', status: 'in_progress', priority: 'high', budget: 60000, progress: 75 },
    { name: 'Data Migration', description: 'Database migration to cloud platform', status: 'completed', priority: 'medium', budget: 35000, progress: 100 },
    { name: 'Process Automation', description: 'Business process automation implementation', status: 'on_hold', priority: 'medium', budget: 70000, progress: 20 }
  ];

  const { data: projects, error } = await supabase
    .from('projects')
    .insert(projectsData.map((project, index) => ({
      ...project,
      organization_id: organizationId,
      assigned_to: profileId,
      account_id: accounts[index % accounts.length]?.id,
      start_date: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(Date.now() + Math.random() * 120 * 24 * 60 * 60 * 1000).toISOString(),
      spent: Math.floor(project.budget * (project.progress / 100))
    })))
    .select();

  if (error) throw error;
  return projects || [];
};

const createInvoices = async (organizationId: string, profileId: string, accounts: any[]) => {
  const timestamp = Date.now();
  const invoicesData = [
    { invoice_number: `INV-${timestamp}-001`, amount: 15000, status: 'paid', due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
    { invoice_number: `INV-${timestamp}-002`, amount: 25000, status: 'sent', due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString() },
    { invoice_number: `INV-${timestamp}-003`, amount: 8000, status: 'draft', due_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString() },
    { invoice_number: `INV-${timestamp}-004`, amount: 32000, status: 'overdue', due_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
    { invoice_number: `INV-${timestamp}-005`, amount: 18500, status: 'paid', due_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString() },
    { invoice_number: `INV-${timestamp}-006`, amount: 42000, status: 'sent', due_date: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString() }
  ];

  const { data: invoices, error } = await supabase
    .from('invoices')
    .insert(invoicesData.map((invoice, index) => ({
      ...invoice,
      organization_id: organizationId,
      created_by: profileId,
      account_id: accounts[index % accounts.length]?.id,
      issue_date: new Date().toISOString(),
      paid_date: invoice.status === 'paid' ? new Date().toISOString() : null,
      notes: `Invoice for services provided to ${accounts[index % accounts.length]?.name || 'Client'}`
    })))
    .select();

  if (error) throw error;
  return invoices || [];
};

const createContentPlans = async (organizationId: string, profileId: string, accounts: any[]) => {
  const contentPlansData = [
    { title: 'Social Media Campaign - Tech Solutions', content_type: 'social_media', platform: 'LinkedIn', status: 'scheduled' },
    { title: 'Blog Post - Industry Trends', content_type: 'blog_post', platform: 'Website', status: 'published' },
    { title: 'Product Demo Video', content_type: 'video', platform: 'YouTube', status: 'review' },
    { title: 'Email Newsletter - Q1 Updates', content_type: 'email', platform: 'Email', status: 'approved' },
    { title: 'Infographic - Market Analysis', content_type: 'image', platform: 'Instagram', status: 'draft' },
    { title: 'Webinar - Best Practices', content_type: 'video', platform: 'Zoom', status: 'scheduled' },
    { title: 'Case Study - Success Story', content_type: 'blog_post', platform: 'Website', status: 'published' },
    { title: 'Social Media - Product Launch', content_type: 'social_media', platform: 'Facebook', status: 'approved' },
    { title: 'Tutorial Video Series', content_type: 'video', platform: 'YouTube', status: 'review' },
    { title: 'Monthly Newsletter', content_type: 'email', platform: 'Email', status: 'draft' }
  ];

  const { data: contentPlans, error } = await supabase
    .from('content_plans')
    .insert(contentPlansData.map((plan, index) => ({
      ...plan,
      organization_id: organizationId,
      assigned_to: profileId,
      account_id: accounts[index % accounts.length]?.id,
      publish_date: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      content: `Content for ${plan.title} - detailed description and strategy for ${plan.content_type} on ${plan.platform}`,
      notes: `Content plan for ${accounts[index % accounts.length]?.name || 'Client'} - ${plan.title}`
    })))
    .select();

  if (error) throw error;
  return contentPlans || [];
};