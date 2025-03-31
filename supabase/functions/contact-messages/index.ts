
// Edge function pour gérer les messages utilisateurs
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

serve(async (req) => {
  // Gérer les requêtes CORS OPTIONS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Initialiser le client Supabase avec la clé de service pour avoir accès admin
  const supabase = createClient(supabaseUrl, supabaseServiceRole);
  
  console.log('Requête reçue:', req.method);
  
  try {
    // Pour les requêtes POST via invoke API
    if (req.method === 'POST') {
      // Récupérer le corps de la requête
      const body = await req.json();
      console.log('Body reçu:', body);
      
      // Récupérer le chemin de la demande depuis le corps
      const path = body.path || 'submit';
      
      // Route pour soumettre un message
      if (path === 'submit') {
        const { name, email, message } = body;
        
        console.log('Données reçues:', { name, email, message });
        
        if (!name || !email || !message) {
          return new Response(
            JSON.stringify({ error: 'Tous les champs sont requis' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Vérifier si l'utilisateur a déjà envoyé un message dans les dernières 24 heures
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
        
        const { data: recentMessages, error: queryError } = await supabase
          .from('contact_messages')
          .select('created_at')
          .eq('email', email)
          .gte('created_at', twentyFourHoursAgo.toISOString())
          .order('created_at', { ascending: false });
          
        if (queryError) {
          console.error('Erreur lors de la vérification des messages récents:', queryError);
          return new Response(
            JSON.stringify({ error: 'Erreur lors de la vérification des messages récents' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Si l'utilisateur a déjà envoyé un message dans les dernières 24 heures
        if (recentMessages && recentMessages.length > 0) {
          return new Response(
            JSON.stringify({ 
              error: 'Limite de message atteinte', 
              message: 'Vous ne pouvez envoyer qu\'un message toutes les 24 heures. Veuillez réessayer plus tard.',
              cooldown: true
            }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const { data, error } = await supabase
          .from('contact_messages')
          .insert([{ name, email, message, is_read: false }])
          .select();
          
        if (error) {
          console.error('Erreur lors de l\'insertion du message:', error);
          return new Response(
            JSON.stringify({ error: 'Erreur lors de l\'envoi du message' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        console.log('Message inséré avec succès:', data);
        
        return new Response(
          JSON.stringify({ success: true, message: 'Message envoyé avec succès', data }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Route pour récupérer tous les messages
      if (path === 'list') {
        // Vérifier l'authentification
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return new Response(
            JSON.stringify({ error: 'Autorisation requise' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        
        if (authError || !user) {
          return new Response(
            JSON.stringify({ error: 'Autorisation invalide' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const { data, error } = await supabase
          .from('contact_messages')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('Erreur lors de la récupération des messages:', error);
          return new Response(
            JSON.stringify({ error: 'Erreur lors de la récupération des messages' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        return new Response(
          JSON.stringify({ success: true, messages: data }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Route pour marquer un message comme lu
      if (path === 'mark-read') {
        // Vérifier l'authentification
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return new Response(
            JSON.stringify({ error: 'Autorisation requise' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        
        if (authError || !user) {
          return new Response(
            JSON.stringify({ error: 'Autorisation invalide' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const { id } = body;
        
        if (!id) {
          return new Response(
            JSON.stringify({ error: 'ID du message requis' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const { data, error } = await supabase
          .from('contact_messages')
          .update({ is_read: true })
          .eq('id', id)
          .select();
          
        if (error) {
          console.error('Erreur lors de la mise à jour du message:', error);
          return new Response(
            JSON.stringify({ error: 'Erreur lors de la mise à jour du message' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        return new Response(
          JSON.stringify({ success: true, message: 'Message marqué comme lu', data }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Route pour supprimer un message
      if (path === 'delete') {
        // Vérifier l'authentification
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return new Response(
            JSON.stringify({ error: 'Autorisation requise' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        
        if (authError || !user) {
          return new Response(
            JSON.stringify({ error: 'Autorisation invalide' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const { id } = body;
        
        if (!id) {
          return new Response(
            JSON.stringify({ error: 'ID du message requis' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const { error } = await supabase
          .from('contact_messages')
          .delete()
          .eq('id', id);
          
        if (error) {
          console.error('Erreur lors de la suppression du message:', error);
          return new Response(
            JSON.stringify({ error: 'Erreur lors de la suppression du message' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        return new Response(
          JSON.stringify({ success: true, message: 'Message supprimé avec succès' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // Si la route n'est pas reconnue
    return new Response(
      JSON.stringify({ error: 'Route non trouvée' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Erreur non gérée:', error);
    return new Response(
      JSON.stringify({ error: 'Une erreur interne est survenue' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
