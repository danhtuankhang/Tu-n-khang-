const { 
    Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, 
    PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, 
    ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, 
    StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ChannelType 
} = require('discord.js');

// --- TẠO WEB SERVER CHO RENDER ---
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot Discord đang chạy 24/7!'));
app.listen(PORT, () => console.log(`🌐 Web server đang chạy trên cổng ${PORT}`));

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = '1495060454110920725';
const GUILD_ID = '1539746803216552046';

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMembers 
    ] 
});

const commands = [
    new SlashCommandBuilder().setName('xacminh').setDescription('Gửi bảng xác minh').setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder().setName('taorolexacminh').setDescription('Tự động tạo Role').setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
    new SlashCommandBuilder().setName('queuekomo').setDescription('Đóng Queue Vanilla ngay lập tức'),
    new SlashCommandBuilder().setName('queuevanilla').setDescription('Mở hàng đợi Queue Vanilla trong 10 phút'),
    new SlashCommandBuilder().setName('tophopvanill').setDescription('Xem danh sách tổng hợp những người đã tham gia Queue'),
    
    new SlashCommandBuilder()
        .setName('ticketvanilla')
        .setDescription('Tạo channel ticket test Vanilla riêng cho người chơi')
        .addUserOption(opt => opt.setName('player').setDescription('Người chơi cần test').setRequired(true)),

    new SlashCommandBuilder().setName('dongtick').setDescription('Đóng và xóa kênh ticket test riêng này'),

    new SlashCommandBuilder()
        .setName('lenhang')
        .setDescription('Cập nhật kết quả test và Lên Hạng cho người chơi')
        .addUserOption(opt => opt.setName('tester').setDescription('Chọn Tester thực hiện test').setRequired(true))
        .addStringOption(opt => opt.setName('ign').setDescription('Tên Minecraft của người chơi').setRequired(true))
        .addStringOption(opt => 
            opt.setName('mode')
               .setDescription('Chọn Mode test')
               .setRequired(true)
               .addChoices(
                   { name: 'Mace', value: 'Mace' },
                   { name: 'Vanilla', value: 'Vanilla' },
                   { name: 'Sword', value: 'Sword' },
                   { name: 'SMP', value: 'SMP' },
                   { name: 'NetheritePot', value: 'NetheritePot' },
                   { name: 'Axe', value: 'Axe' },
                   { name: 'UHC', value: 'UHC' },
                   { name: 'DiamondPot', value: 'DiamondPot' }
               )
        )
        .addStringOption(opt => 
            opt.setName('rank')
               .setDescription('Rank đạt được')
               .setRequired(true)
               .addChoices(
                   { name: 'High Tier 1', value: 'High Tier 1' },
                   { name: 'Low Tier 1', value: 'Low Tier 1' },
                   { name: 'High Tier 2', value: 'High Tier 2' },
                   { name: 'Low Tier 2', value: 'Low Tier 2' },
                   { name: 'High Tier 3', value: 'High Tier 3' },
                   { name: 'Low Tier 3', value: 'Low Tier 3' },
                   { name: 'High Tier 4', value: 'High Tier 4' },
                   { name: 'Low Tier 4', value: 'Low Tier 4' },
                   { name: 'High Tier 5', value: 'High Tier 5' },
                   { name: 'Low Tier 5', value: 'Low Tier 5' }
               )
        )
        .addStringOption(opt => opt.setName('previous_rank').setDescription('Rank cũ (Mặc định: Unranked)').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Cấm (Ban) người chơi khỏi hệ thống test hoặc Discord')
        .addStringOption(opt => opt.setName('ign').setDescription('Tên Minecraft hoặc Discord Username').setRequired(true))
        .addStringOption(opt => opt.setName('li_do').setDescription('Lý do cấm').setRequired(true))
        .addUserOption(opt => opt.setName('user').setDescription('Tag tài khoản Discord người chơi').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    new SlashCommandBuilder()
        .setName('win')
        .setDescription('Ghi nhận tỉ số trận test')
        .addUserOption(opt => opt.setName('tester').setDescription('Chọn Tester thực hiện test').setRequired(true))
        .addStringOption(opt => 
            opt.setName('mode')
               .setDescription('Chọn Mode test')
               .setRequired(true)
               .addChoices(
                   { name: 'Mace', value: 'Mace' },
                   { name: 'Vanilla', value: 'Vanilla' },
                   { name: 'Sword', value: 'Sword' },
                   { name: 'SMP', value: 'SMP' },
                   { name: 'NetheritePot', value: 'NetheritePot' },
                   { name: 'Axe', value: 'Axe' },
                   { name: 'UHC', value: 'UHC' },
                   { name: 'DiamondPot', value: 'DiamondPot' }
               )
        )
        .addStringOption(opt => opt.setName('ign').setDescription('Tên Minecraft của người chơi').setRequired(true))
        .addStringOption(opt => opt.setName('ti_so').setDescription('Tỉ số trận đấu (VD: 4:0 hoặc 0:0)').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

client.once('ready', async () => {
    console.log(`✅ Bot ${client.user.tag} đã online!`);
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
});

client.on('guildMemberAdd', async member => {
    try {
        let role = member.guild.roles.cache.find(r => r.name === 'Membre');
        if (!role) {
            role = await member.guild.roles.create({
                name: 'Membre',
                color: '#2ECC71',
                reason: 'Tự động tạo Role Membre cho thành viên mới'
            });
        }
        await member.roles.add(role);
        console.log(`✅ Đã cấp role Membre cho thành viên ${member.user.tag}`);
    } catch (error) {
        console.error(`❌ Lỗi khi tự động cấp role Membre:`, error);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'win') {
        await interaction.deferReply();
        const tester = interaction.options.getUser('tester');
        const mode = interaction.options.getString('mode');
        const ign = interaction.options.getString('ign');
        const score = interaction.options.getString('ti_so');
        const skinUrl = `https://visage.surgeplay.com/bust/512/${encodeURIComponent(ign)}`;

        const embedWin = new EmbedBuilder()
            .setColor('#00FF00')
            .setAuthor({ name: `${ign}'s Match Results` })
            .setTitle('⚔️ KẾT QUẢ TRẬN TEST')
            .addFields(
                { name: '👑 Tester', value: `${tester}`, inline: true },
                { name: '🎮 Người chơi', value: `**${ign}**`, inline: true },
                { name: '🎯 Mode', value: `**${mode}**`, inline: true },
                { name: '📊 Tỉ số (Score)', value: `\`\`\`${score}\`\`\``, inline: false }
            )
            .setThumbnail(skinUrl)
            .setTimestamp()
            .setFooter({ text: 'Hệ thống Quản lý Tier List' });

        await interaction.editReply({ embeds: [embedWin] });
    }

    if (interaction.commandName === 'ban') {
        await interaction.deferReply();
        const ign = interaction.options.getString('ign');
        const reason = interaction.options.getString('li_do');
        const targetUser = interaction.options.getUser('user');
        const skinUrl = `https://visage.surgeplay.com/bust/512/${encodeURIComponent(ign)}`;

        if (targetUser) {
            try {
                await interaction.guild.members.ban(targetUser, { reason: reason });
            } catch (err) {
                console.error("Lỗi khi Ban trên Discord:", err);
            }
        }

        const embedBan = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('🚫 BẢNG THÔNG BÁO BAN / CẤM')
            .addFields(
                { name: '👤 Tên người chơi (IGN)', value: `**${ign}**`, inline: true },
                { name: '🛡️ Người xử lý', value: `${interaction.user}`, inline: true },
                { name: '📄 Lý do bị Ban', value: `\`\`\`${reason}\`\`\``, inline: false }
            )
            .setThumbnail(skinUrl)
            .setTimestamp()
            .setFooter({ text: 'Hệ thống Quản lý Tier List' });

        await interaction.editReply({ embeds: [embedBan] });
    }

    if (interaction.commandName === 'dongtick') {
        await interaction.reply('🔒 **Ticket này sẽ được xoá sau 5 giây...**');
        setTimeout(() => {
            interaction.channel.delete().catch(err => console.error(err));
        }, 5000);
    }

    if (interaction.commandName === 'lenhang') {
        await interaction.deferReply();
        const tester = interaction.options.getUser('tester');
        const ign = interaction.options.getString('ign');
        const mode = interaction.options.getString('mode');
        const rankEarned = interaction.options.getString('rank');
        const previousRank = interaction.options.getString('previous_rank') || 'Unranked';
        const skinUrl = `https://visage.surgeplay.com/bust/512/${encodeURIComponent(ign)}`;

        const embedResult = new EmbedBuilder()
            .setColor('#DC143C')
            .setAuthor({ name: `${ign}'s Test Results` })
            .setTitle('🏆')
            .addFields(
                { name: 'Tester', value: `${tester}`, inline: false },
                { name: 'Username', value: `${ign}`, inline: false },
                { name: 'Mode', value: `${mode}`, inline: false },
                { name: 'Previous Rank', value: `${previousRank}`, inline: false },
                { name: 'Rank Earned', value: `${rankEarned}`, inline: false }
            )
            .setThumbnail(skinUrl);

        await interaction.editReply({ embeds: [embedResult] });
    }
});

client.login(TOKEN);
                     
