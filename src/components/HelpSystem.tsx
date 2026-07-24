import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from 'react-i18next';
import { HelpCircle, X, Play, CheckCircle, ArrowRight, Lightbulb, Target, Users, FileText, Building2, Briefcase } from 'lucide-react';

interface HelpStep {
  title: string;
  description: string;
  action?: string;
  tip?: string;
}

interface HelpContent {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  steps: HelpStep[];
  tips: string[];
  commonIssues?: { problem: string; solution: string }[];
}

interface HelpSystemProps {
  feature: string;
  className?: string;
}

const helpContent: Record<string, HelpContent> = {
  dashboard: {
    title: 'Dashboard Overview',
    description: 'Your central hub for monitoring business performance and key metrics',
    icon: Target,
    category: 'Analytics',
    difficulty: 'beginner',
    estimatedTime: '5 minutes',
    steps: [
      {
        title: 'Understanding Key Metrics',
        description: 'The top cards show your most important business indicators: Total Revenue, Pipeline Value, Total Customers, and Active Deals.',
        action: 'Look at the percentage changes to see growth trends'
      },
      {
        title: 'Using Date Filters',
        description: 'Click the date dropdown to filter data by different time periods.',
        action: 'Try switching between Last 7 days, 30 days, 3 months, or 6 months'
      },
      {
        title: 'Exporting Data',
        description: 'Use the Export Data button to download all dashboard metrics as an Excel file.',
        action: 'Click Export Data to generate a comprehensive report'
      },
      {
        title: 'Analyzing Charts',
        description: 'Switch between Overview, Revenue, Customers, and Performance tabs to see detailed analytics.',
        action: 'Click each tab to explore different aspects of your business'
      }
    ],
    tips: [
      'Check your dashboard daily to stay on top of business performance',
      'Use the date filters to identify seasonal trends',
      'Export data regularly for offline analysis and reporting',
      'Pay attention to the growth percentages for quick insights'
    ],
    commonIssues: [
      {
        problem: 'Charts not loading',
        solution: 'Refresh the page or check your internet connection'
      },
      {
        problem: 'Export not working',
        solution: 'Ensure your browser allows downloads and try again'
      }
    ]
  },
  leads: {
    title: 'Lead Management',
    description: 'Capture, track, and convert potential customers into deals',
    icon: Users,
    category: 'Sales',
    difficulty: 'beginner',
    estimatedTime: '10 minutes',
    steps: [
      {
        title: 'Adding New Leads',
        description: 'Click the "Add New Lead" button to create a new lead record.',
        action: 'Fill in at least the required fields: First Name, Last Name, Email, and Phone'
      },
      {
        title: 'Lead Information',
        description: 'Complete all relevant fields including company, job title, source, and status.',
        action: 'Add tags and notes to better organize and remember important details'
      },
      {
        title: 'Managing Lead Status',
        description: 'Update lead status as you progress: New → Contacted → Qualified → Converted/Lost.',
        action: 'Use the status badges to quickly identify where each lead stands'
      },
      {
        title: 'Viewing and Editing',
        description: 'Use the View button to see all lead details, or Edit to modify information.',
        action: 'Double-click any lead card for quick access to details'
      },
      {
        title: 'Filtering and Search',
        description: 'Use the search bar and filters to find specific leads quickly.',
        action: 'Filter by status, source, or search by name/company'
      }
    ],
    tips: [
      'Always add a source to track which marketing channels work best',
      'Use tags to categorize leads by industry, size, or priority',
      'Update lead status regularly to maintain accurate pipeline visibility',
      'Add detailed notes after each interaction for better follow-up'
    ],
    commonIssues: [
      {
        problem: 'Cannot create lead',
        solution: 'Ensure all required fields (marked with *) are filled'
      },
      {
        problem: 'Lead not appearing in list',
        solution: 'Check your filters and search terms, or refresh the page'
      }
    ]
  },
  tasks: {
    title: 'Task Management',
    description: 'Organize, assign, and track work items across your team',
    icon: CheckCircle,
    category: 'Productivity',
    difficulty: 'intermediate',
    estimatedTime: '15 minutes',
    steps: [
      {
        title: 'Creating Tasks',
        description: 'Click "New Task" to create a task with title, description, and details.',
        action: 'Set priority, due date, and estimated hours for better planning'
      },
      {
        title: 'Task Assignment',
        description: 'Assign tasks to team members using the assignee dropdown.',
        action: 'You can assign multiple people to the same task'
      },
      {
        title: 'Status Management',
        description: 'Move tasks through workflow: To Do → In Progress → Review → Completed.',
        action: 'Use the status dropdown on each task card for quick updates'
      },
      {
        title: 'Adding Tags and Details',
        description: 'Use tags to categorize tasks and add detailed descriptions.',
        action: 'Tags help with filtering and organizing related tasks'
      },
      {
        title: 'Tracking Progress',
        description: 'Monitor task progress with the progress bar and status indicators.',
        action: 'Check the overdue section to prioritize urgent tasks'
      }
    ],
    tips: [
      'Set realistic due dates and estimated hours for better planning',
      'Use tags consistently across your team for better organization',
      'Review overdue tasks daily and adjust priorities as needed',
      'Add detailed descriptions to avoid confusion and rework'
    ],
    commonIssues: [
      {
        problem: 'Cannot assign task',
        solution: 'Ensure the team member is active in your organization'
      },
      {
        problem: 'Task not updating',
        solution: 'Check your internet connection and try refreshing the page'
      }
    ]
  },
  mindmap: {
    title: 'Mind Mapping',
    description: 'Create visual representations of ideas, processes, and relationships',
    icon: Lightbulb,
    category: 'Planning',
    difficulty: 'intermediate',
    estimatedTime: '20 minutes',
    steps: [
      {
        title: 'Getting Started',
        description: 'Start with the central idea node and build your map around it.',
        action: 'Double-click the central node to edit its content'
      },
      {
        title: 'Adding Nodes',
        description: 'Drag different node types from the left panel onto the canvas.',
        action: 'Try text nodes, sticky notes, links, images, and entity nodes'
      },
      {
        title: 'Connecting Ideas',
        description: 'Click and drag from one node to another to create connections.',
        action: 'Connections show relationships between different concepts'
      },
      {
        title: 'Organizing Content',
        description: 'Use different node types for different purposes: text for ideas, sticky notes for reminders.',
        action: 'Color-code sticky notes to categorize information'
      },
      {
        title: 'Saving and Sharing',
        description: 'Save your mind map and share it with your team for collaboration.',
        action: 'Use the Save button and then Share with Team for collaboration'
      }
    ],
    tips: [
      'Start simple and gradually add more detail to your mind map',
      'Use colors and different node types to make information easier to understand',
      'Save frequently to avoid losing your work',
      'Share with team members for collaborative brainstorming sessions'
    ],
    commonIssues: [
      {
        problem: 'Nodes not connecting',
        solution: 'Make sure to drag from the edge of one node to another node'
      },
      {
        problem: 'Cannot save mind map',
        solution: 'Add a title to your mind map before saving'
      }
    ]
  },
  deals: {
    title: 'Deal Management',
    description: 'Track and manage your sales opportunities through the pipeline',
    icon: Target,
    category: 'Sales',
    difficulty: 'intermediate',
    estimatedTime: '12 minutes',
    steps: [
      {
        title: 'Creating New Deals',
        description: 'Click "Add New Deal" to create a deal with name, account, and value.',
        action: 'Select an existing account or create a new one for the deal'
      },
      {
        title: 'Setting Deal Details',
        description: 'Add deal value, stage, probability, and expected close date.',
        action: 'Set realistic probability based on your sales process'
      },
      {
        title: 'Managing Pipeline Stages',
        description: 'Move deals through stages: Lead → Proposal → Negotiation → Closed Won/Lost.',
        action: 'Update stage as you progress with the prospect'
      },
      {
        title: 'Tracking Performance',
        description: 'Monitor total value, weighted pipeline, and win rate metrics.',
        action: 'Use the stats cards to track your sales performance'
      }
    ],
    tips: [
      'Keep deal values realistic and update them as negotiations progress',
      'Set probability based on your actual sales process and historical data',
      'Update deal stages promptly to maintain accurate pipeline visibility',
      'Add detailed descriptions to track important deal context'
    ],
    commonIssues: [
      {
        problem: 'Cannot create deal without account',
        solution: 'Create an account first, then associate it with the deal'
      },
      {
        problem: 'Deal value not updating in reports',
        solution: 'Refresh the page or check if the deal stage is set correctly'
      }
    ]
  },
  accounts: {
    title: 'Account Management',
    description: 'Manage your customer and prospect company information',
    icon: Building2,
    category: 'CRM',
    difficulty: 'beginner',
    estimatedTime: '8 minutes',
    steps: [
      {
        title: 'Adding New Accounts',
        description: 'Click "Add New Account" to create a company record.',
        action: 'Fill in company name and email as minimum required fields'
      },
      {
        title: 'Account Information',
        description: 'Complete industry, website, phone, and address details.',
        action: 'Add as much detail as possible for better relationship management'
      },
      {
        title: 'Organizing Accounts',
        description: 'Use industry filters and search to find accounts quickly.',
        action: 'Filter by industry to focus on specific market segments'
      },
      {
        title: 'Account Relationships',
        description: 'View account details to see associated deals and contacts.',
        action: 'Use the View button to see complete account information'
      }
    ],
    tips: [
      'Always include industry information for better segmentation',
      'Add website URLs to quickly access company information',
      'Use consistent naming conventions for better organization',
      'Regular cleanup of duplicate accounts improves data quality'
    ],
    commonIssues: [
      {
        problem: 'Duplicate accounts appearing',
        solution: 'Search before creating new accounts to avoid duplicates'
      },
      {
        problem: 'Cannot find specific account',
        solution: 'Use the search function or check industry filters'
      }
    ]
  },
  projects: {
    title: 'Project Management',
    description: 'Plan, track, and deliver projects successfully',
    icon: Briefcase,
    category: 'Operations',
    difficulty: 'intermediate',
    estimatedTime: '15 minutes',
    steps: [
      {
        title: 'Creating Projects',
        description: 'Click "New Project" to create a project with name and description.',
        action: 'Set clear project objectives and deliverables'
      },
      {
        title: 'Project Planning',
        description: 'Set budget, start date, end date, and priority level.',
        action: 'Break down large projects into smaller, manageable phases'
      },
      {
        title: 'Status Management',
        description: 'Track project progress through Planning → In Progress → Completed.',
        action: 'Update status regularly to reflect current project state'
      },
      {
        title: 'Resource Tracking',
        description: 'Monitor budget usage and project timeline adherence.',
        action: 'Review project metrics regularly to stay on track'
      }
    ],
    tips: [
      'Set realistic timelines with buffer time for unexpected issues',
      'Define clear project scope to avoid scope creep',
      'Regular status updates keep stakeholders informed',
      'Document lessons learned for future project improvements'
    ],
    commonIssues: [
      {
        problem: 'Project timeline unrealistic',
        solution: 'Break project into smaller phases with individual deadlines'
      },
      {
        problem: 'Budget tracking not accurate',
        solution: 'Update spent amounts regularly and track against budget'
      }
    ]
  }
};

export function HelpSystem({ feature, className = '' }: HelpSystemProps) {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  const content = helpContent[feature];
  const isRTL = i18n.language === 'ar';
  
  if (!content) return null;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    const translations = {
      beginner: isRTL ? 'مبتدئ' : 'Beginner',
      intermediate: isRTL ? 'متوسط' : 'Intermediate',
      advanced: isRTL ? 'متقدم' : 'Advanced'
    };
    return translations[difficulty as keyof typeof translations] || difficulty;
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={`text-muted-foreground hover:text-foreground ${className}`}
        title={isRTL ? 'مساعدة' : 'Help'}
      >
        <HelpCircle className="w-4 h-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <content.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold">
                    {isRTL ? getArabicTitle(feature) : content.title}
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground">
                    {isRTL ? getArabicDescription(feature) : content.description}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-4 pt-2">
              <Badge variant="secondary" className="text-xs">
                {isRTL ? 'الفئة:' : 'Category:'} {content.category}
              </Badge>
              <Badge className={`text-xs ${getDifficultyColor(content.difficulty)}`}>
                {getDifficultyText(content.difficulty)}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Play className="w-3 h-3" />
                {content.estimatedTime}
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-6">
              {/* Steps Section */}
              <div>
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  {isRTL ? 'خطوات الاستخدام' : 'How to Use'}
                </h3>
                <div className="space-y-4">
                  {content.steps.map((step, index) => (
                    <div key={index} className="flex gap-4 p-4 bg-muted/50 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium mb-2">
                          {isRTL ? getArabicStepTitle(feature, index) : step.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {isRTL ? getArabicStepDescription(feature, index) : step.description}
                        </p>
                        {step.action && (
                          <div className="flex items-center gap-2 text-xs text-primary bg-primary/10 px-3 py-2 rounded">
                            <ArrowRight className="w-3 h-3" />
                            {isRTL ? getArabicStepAction(feature, index) : step.action}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Tips Section */}
              <div>
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  {isRTL ? 'نصائح مفيدة' : 'Pro Tips'}
                </h3>
                <div className="grid gap-3">
                  {content.tips.map((tip, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <Lightbulb className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-yellow-800">
                        {isRTL ? getArabicTip(feature, index) : tip}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Common Issues Section */}
              {content.commonIssues && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <Target className="w-5 h-5 text-red-500" />
                      {isRTL ? 'حل المشاكل الشائعة' : 'Troubleshooting'}
                    </h3>
                    <div className="space-y-3">
                      {content.commonIssues.map((issue, index) => (
                        <div key={index} className="p-4 border border-red-200 bg-red-50 rounded-lg">
                          <h4 className="font-medium text-red-800 mb-2">
                            {isRTL ? '❌ ' : '❌ '}{isRTL ? getArabicIssueProblem(feature, index) : issue.problem}
                          </h4>
                          <p className="text-sm text-red-700">
                            {isRTL ? '✅ ' : '✅ '}{isRTL ? getArabicIssueSolution(feature, index) : issue.solution}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => setIsOpen(false)}>
              {isRTL ? 'فهمت' : 'Got it'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Arabic translations helper functions
function getArabicTitle(feature: string): string {
  const titles = {
    dashboard: 'لوحة التحكم',
    leads: 'إدارة العملاء المحتملين',
    tasks: 'إدارة المهام',
    mindmap: 'الخرائط الذهنية'
  };
  return titles[feature as keyof typeof titles] || feature;
}

function getArabicDescription(feature: string): string {
  const descriptions = {
    dashboard: 'مركزك الرئيسي لمراقبة أداء الأعمال والمقاييس الرئيسية',
    leads: 'التقط وتتبع وحول العملاء المحتملين إلى صفقات',
    tasks: 'نظم وأسند وتتبع عناصر العمل عبر فريقك',
    mindmap: 'أنشئ تمثيلات بصرية للأفكار والعمليات والعلاقات'
  };
  return descriptions[feature as keyof typeof descriptions] || '';
}

function getArabicStepTitle(feature: string, index: number): string {
  const steps = {
    dashboard: [
      'فهم المقاييس الرئيسية',
      'استخدام مرشحات التاريخ',
      'تصدير البيانات',
      'تحليل الرسوم البيانية'
    ],
    leads: [
      'إضافة عملاء محتملين جدد',
      'معلومات العميل المحتمل',
      'إدارة حالة العميل المحتمل',
      'العرض والتحرير',
      'التصفية والبحث'
    ],
    tasks: [
      'إنشاء المهام',
      'تعيين المهام',
      'إدارة الحالة',
      'إضافة العلامات والتفاصيل',
      'تتبع التقدم'
    ],
    mindmap: [
      'البدء',
      'إضافة العقد',
      'ربط الأفكار',
      'تنظيم المحتوى',
      'الحفظ والمشاركة'
    ]
  };
  return steps[feature as keyof typeof steps]?.[index] || '';
}

function getArabicStepDescription(feature: string, index: number): string {
  const descriptions = {
    dashboard: [
      'البطاقات العلوية تظهر أهم مؤشرات أعمالك: إجمالي الإيرادات، قيمة خط الأنابيب، إجمالي العملاء، والصفقات النشطة.',
      'انقر على قائمة التاريخ المنسدلة لتصفية البيانات حسب فترات زمنية مختلفة.',
      'استخدم زر تصدير البيانات لتنزيل جميع مقاييس لوحة التحكم كملف Excel.',
      'تبديل بين علامات التبويب نظرة عامة، الإيرادات، العملاء، والأداء لرؤية تحليلات مفصلة.'
    ],
    leads: [
      'انقر على زر "إضافة عميل محتمل جديد" لإنشاء سجل عميل محتمل جديد.',
      'أكمل جميع الحقول ذات الصلة بما في ذلك الشركة، المسمى الوظيفي، المصدر، والحالة.',
      'حدث حالة العميل المحتمل أثناء التقدم: جديد ← تم الاتصال ← مؤهل ← محول/مفقود.',
      'استخدم زر العرض لرؤية جميع تفاصيل العميل المحتمل، أو التحرير لتعديل المعلومات.',
      'استخدم شريط البحث والمرشحات للعثور على عملاء محتملين محددين بسرعة.'
    ],
    tasks: [
      'انقر على "مهمة جديدة" لإنشاء مهمة بعنوان ووصف وتفاصيل.',
      'عين المهام لأعضاء الفريق باستخدام قائمة المعين المنسدلة.',
      'انقل المهام عبر سير العمل: للقيام ← قيد التنفيذ ← مراجعة ← مكتملة.',
      'استخدم العلامات لتصنيف المهام وإضافة أوصاف مفصلة.',
      'راقب تقدم المهمة بشريط التقدم ومؤشرات الحالة.'
    ],
    mindmap: [
      'ابدأ بعقدة الفكرة المركزية وابن خريطتك حولها.',
      'اسحب أنواع العقد المختلفة من اللوحة اليسرى إلى اللوحة.',
      'انقر واسحب من عقدة إلى أخرى لإنشاء اتصالات.',
      'استخدم أنواع عقد مختلفة لأغراض مختلفة: نص للأفكار، ملاحظات لاصقة للتذكيرات.',
      'احفظ خريطتك الذهنية وشاركها مع فريقك للتعاون.'
    ]
  };
  return descriptions[feature as keyof typeof descriptions]?.[index] || '';
}

function getArabicStepAction(feature: string, index: number): string {
  const actions = {
    dashboard: [
      'انظر إلى التغييرات المئوية لرؤية اتجاهات النمو',
      'جرب التبديل بين آخر 7 أيام، 30 يوماً، 3 أشهر، أو 6 أشهر',
      'انقر على تصدير البيانات لإنشاء تقرير شامل',
      'انقر على كل علامة تبويب لاستكشاف جوانب مختلفة من عملك'
    ],
    leads: [
      'املأ على الأقل الحقول المطلوبة: الاسم الأول، الاسم الأخير، البريد الإلكتروني، والهاتف',
      'أضف علامات وملاحظات لتنظيم وتذكر التفاصيل المهمة بشكل أفضل',
      'استخدم شارات الحالة لتحديد مكان كل عميل محتمل بسرعة',
      'انقر نقراً مزدوجاً على أي بطاقة عميل محتمل للوصول السريع للتفاصيل',
      'صفي حسب الحالة، المصدر، أو ابحث بالاسم/الشركة'
    ],
    tasks: [
      'حدد الأولوية، تاريخ الاستحقاق، والساعات المقدرة للتخطيط الأفضل',
      'يمكنك تعيين عدة أشخاص لنفس المهمة',
      'استخدم القائمة المنسدلة للحالة على كل بطاقة مهمة للتحديثات السريعة',
      'العلامات تساعد في التصفية وتنظيم المهام ذات الصلة',
      'تحقق من قسم المتأخرة لإعطاء الأولوية للمهام العاجلة'
    ],
    mindmap: [
      'انقر نقراً مزدوجاً على العقدة المركزية لتحرير محتواها',
      'جرب عقد النص، الملاحظات اللاصقة، الروابط، الصور، وعقد الكيانات',
      'الاتصالات تظهر العلاقات بين المفاهيم المختلفة',
      'رمز الملاحظات اللاصقة بالألوان لتصنيف المعلومات',
      'استخدم زر الحفظ ثم المشاركة مع الفريق للتعاون'
    ]
  };
  return actions[feature as keyof typeof actions]?.[index] || '';
}

function getArabicTip(feature: string, index: number): string {
  const tips = {
    dashboard: [
      'تحقق من لوحة التحكم يومياً للبقاء على اطلاع على أداء الأعمال',
      'استخدم مرشحات التاريخ لتحديد الاتجاهات الموسمية',
      'صدر البيانات بانتظام للتحليل والتقارير دون اتصال',
      'انتبه للنسب المئوية للنمو للحصول على رؤى سريعة'
    ],
    leads: [
      'أضف دائماً مصدراً لتتبع أي قنوات التسويق تعمل بشكل أفضل',
      'استخدم العلامات لتصنيف العملاء المحتملين حسب الصناعة، الحجم، أو الأولوية',
      'حدث حالة العميل المحتمل بانتظام للحفاظ على رؤية دقيقة لخط الأنابيب',
      'أضف ملاحظات مفصلة بعد كل تفاعل لمتابعة أفضل'
    ],
    tasks: [
      'حدد تواريخ استحقاق وساعات مقدرة واقعية للتخطيط الأفضل',
      'استخدم العلامات بثبات عبر فريقك لتنظيم أفضل',
      'راجع المهام المتأخرة يومياً واضبط الأولويات حسب الحاجة',
      'أضف أوصافاً مفصلة لتجنب الالتباس وإعادة العمل'
    ],
    mindmap: [
      'ابدأ بسيط وأضف تدريجياً المزيد من التفاصيل لخريطتك الذهنية',
      'استخدم الألوان وأنواع العقد المختلفة لجعل المعلومات أسهل للفهم',
      'احفظ بكثرة لتجنب فقدان عملك',
      'شارك مع أعضاء الفريق لجلسات العصف الذهني التعاونية'
    ]
  };
  return tips[feature as keyof typeof tips]?.[index] || '';
}

function getArabicIssueProblem(feature: string, index: number): string {
  const problems = {
    dashboard: [
      'الرسوم البيانية لا تحمل',
      'التصدير لا يعمل'
    ],
    leads: [
      'لا يمكن إنشاء عميل محتمل',
      'العميل المحتمل لا يظهر في القائمة'
    ],
    tasks: [
      'لا يمكن تعيين المهمة',
      'المهمة لا تحدث'
    ],
    mindmap: [
      'العقد لا تتصل',
      'لا يمكن حفظ الخريطة الذهنية'
    ]
  };
  return problems[feature as keyof typeof problems]?.[index] || '';
}

function getArabicIssueSolution(feature: string, index: number): string {
  const solutions = {
    dashboard: [
      'حدث الصفحة أو تحقق من اتصال الإنترنت',
      'تأكد من أن متصفحك يسمح بالتنزيلات وحاول مرة أخرى'
    ],
    leads: [
      'تأكد من ملء جميع الحقول المطلوبة (المميزة بـ *)',
      'تحقق من المرشحات ومصطلحات البحث، أو حدث الصفحة'
    ],
    tasks: [
      'تأكد من أن عضو الفريق نشط في منظمتك',
      'تحقق من اتصال الإنترنت وحاول تحديث الصفحة'
    ],
    mindmap: [
      'تأكد من السحب من حافة عقدة إلى عقدة أخرى',
      'أضف عنواناً لخريطتك الذهنية قبل الحفظ'
    ]
  };
  return solutions[feature as keyof typeof solutions]?.[index] || '';
}