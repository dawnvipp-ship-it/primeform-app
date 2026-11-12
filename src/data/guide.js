// Cẩm nang Prime Form - the content. Plain data, no UI, no imports, so the
// build-time check (scripts/check-guide.mjs) can load it directly.
//
// A card only reaches clients when `approved` is true. Setting it to true is the
// head coach's sign-off on the wording (it is health-adjacent content). Cards with
// approved:false may be unfinished drafts; approved ones must pass the checks in
// scripts/check-guide.mjs or the build fails.

export const GUIDE_SAFETY = 'Nội dung này không thay thế tư vấn y tế.'

// Fixed display order.
export const GUIDE_GROUPS = [
  { key: 'bat-dau', label: 'Bắt đầu đúng' },
  { key: 'ket-qua', label: 'Hiểu kết quả' },
  { key: 'co-the', label: 'Cơ bắp và thành phần cơ thể' },
  { key: 'phuc-hoi', label: 'Stress và phục hồi' },
  { key: 'duy-tri', label: 'Duy trì khi lỡ nhịp' },
  { key: 'an-toan', label: 'An toàn' },
]

// body: array of paragraphs. action: ONE small thing for today.
export const GUIDE_CARDS = [
  {
    id: 'PF01', group: 'bat-dau', approved: true,
    title: 'Bắt đầu đúng quan trọng hơn bắt đầu nhanh',
    summary: 'Cơ thể cần thời gian thích nghi với một lịch tập mới.',
    body: [
      "Ở những tuần đầu, điều quan trọng nhất không phải là tập nặng hay tập nhiều, mà là xây một nền vững: kỹ thuật đúng, lịch tập đều và một cơ thể quen dần với vận động.",
      "Cảm giác mỏi cơ nhẹ sau buổi tập thường gặp khi cơ thể làm quen với một kích thích mới, và thường giảm dần khi bạn tập đều. Nếu bạn thấy đau nhói, đau kéo dài hoặc đau ở một khớp cụ thể, hãy cho HLV biết ngay để chúng tôi điều chỉnh.",
      "Chúng tôi chủ động giữ tải ở mức vừa phải trong giai đoạn đầu. Điều đó không có nghĩa bạn đang tập nhẹ hay chương trình chưa đủ. Chúng tôi dùng thời gian này để quan sát cách cơ thể bạn vận động, rồi tăng tải khi bạn đã sẵn sàng.",
      "Bắt đầu chậm hơn một chút thường giúp bạn tập được lâu hơn về sau.",
      "Một lịch tập bạn giữ được đều đặn có giá trị hơn một lịch tập quá sức chỉ kéo dài vài tuần.",
    ],
    action: "Sau buổi tập kế tiếp, hãy nói với HLV một điều bạn thấy dễ và một điều bạn thấy chưa quen.",
  },
  {
    id: 'PF02', group: 'bat-dau', approved: true,
    title: 'Vì sao 3 tuần đầu chưa thấy thay đổi?',
    summary: 'Thay đổi ban đầu không phải lúc nào cũng hiện rõ trên cân hoặc hình thể.',
    body: [
      'Khi bắt đầu một chương trình tập luyện, bạn có thể kỳ vọng cơ thể thay đổi rõ ràng sau vài tuần. Tuy nhiên, quá trình thích nghi không phải lúc nào cũng thể hiện ngay qua cân nặng hoặc số đo.',
      'Trong giai đoạn đầu, cơ thể đang làm quen với khối lượng vận động, kỹ thuật tập luyện và lịch sinh hoạt mới. Cảm giác mỏi cơ, thay đổi mức năng lượng hoặc dao động cân nặng cũng có thể xuất hiện trong quá trình này.',
      'Ngoài ra, kết quả còn phụ thuộc vào nhiều yếu tố như mức độ nhất quán, dinh dưỡng, giấc ngủ và hoạt động hằng ngày.',
      'Vì vậy, thay vì kết luận sớm, chúng tôi nhìn vào xu hướng qua nhiều tuần và điều chỉnh khi có đủ thông tin.',
      'Nếu bạn muốn đổi kế hoạch vì chưa thấy kết quả, hãy trao đổi với HLV trước. Duy trì những điều bạn đang làm được thường hữu ích hơn thay đổi liên tục.',
    ],
    action: 'Xem lại lịch tập và thói quen tuần vừa qua. Chọn một điều bạn có thể tiếp tục duy trì trong tuần tới.',
  },
  {
    id: 'PF03', group: 'ket-qua', approved: true,
    title: 'Cân nặng dao động',
    summary: 'Cân nặng thay đổi hằng ngày do nhiều yếu tố ngoài mỡ cơ thể.',
    body: [
      'Cân nặng của bạn không nhất thiết giữ nguyên mỗi ngày. Ngay cả khi duy trì chế độ tập luyện và ăn uống tương đối ổn định, con số trên cân vẫn có thể thay đổi.',
      'Một số yếu tố có thể ảnh hưởng đến cân nặng ngắn hạn gồm lượng nước cơ thể giữ lại, lượng thức ăn trong hệ tiêu hóa, lượng carbohydrate đã ăn và những thay đổi trong sinh hoạt.',
      'Vì vậy, một lần cân tăng không đồng nghĩa với việc bạn đã tăng mỡ. Tương tự, một lần cân giảm cũng chưa chắc phản ánh sự thay đổi thực sự về thành phần cơ thể.',
      'Chúng tôi khuyến khích bạn quan sát xu hướng qua nhiều lần đo trong điều kiện tương đối giống nhau, thay vì đưa ra kết luận từ một con số riêng lẻ.',
      'Quá trình tập luyện cần được đánh giá bằng nhiều thông tin, không chỉ cân nặng.',
    ],
    action: 'Ghi lại con số hôm nay như một dữ liệu bình thường và tiếp tục sinh hoạt như thường lệ.',
  },
  {
    id: 'PF04', group: 'ket-qua', approved: true,
    title: 'Đừng chỉ nhìn vào một chỉ số',
    summary: 'Cân nặng, vòng eo và body fat phản ánh những khía cạnh khác nhau.',
    body: [
      "Mỗi con số trong app cho bạn một góc nhìn khác nhau về cơ thể, và không con số nào kể được toàn bộ câu chuyện.",
      "Cân nặng là tổng của nhiều thứ: mỡ, cơ, nước, xương và cả thức ăn đang có trong cơ thể. Vì vậy cân nặng có thể đứng yên trong khi hình thể vẫn đang thay đổi.",
      "Vòng eo cho biết sự thay đổi ở vùng bụng, nên thường nhạy hơn cân nặng khi bạn đang giảm mỡ và giữ được khối cơ.",
      "Body fat là một ước tính. Các thiết bị đo khác nhau có thể cho kết quả khác nhau, nên chỉ nên so sánh các lần đo cùng một cách đo.",
      "Ngoài các con số, hãy để ý cả những điều khó đo hơn: quần áo vừa hơn, vận động nhẹ nhàng hơn, buổi tập bớt mệt, giấc ngủ ổn định hơn.",
      "Khi một chỉ số chưa như mong muốn, chúng tôi xem cả những chỉ số còn lại trước khi điều chỉnh kế hoạch.",
    ],
    action: "Mở trang Tiến độ và xem một chỉ số khác ngoài cân nặng.",
  },
  {
    id: 'PF05', group: 'co-the', approved: true,
    title: 'Cơ bắp cần thời gian để phát triển',
    summary: 'Tăng cơ là quá trình thích nghi cần tập luyện và phục hồi phù hợp.',
    body: [
      "Cơ bắp phát triển khi cơ thể được tập luyện đủ để thích nghi, rồi có đủ thời gian và điều kiện để phục hồi. Đây là một quá trình chậm hơn nhiều người tưởng.",
      "Ba điều thường quan trọng là tập tiến dần theo thời gian, ăn đủ protein và năng lượng theo kế hoạch HLV đã đưa, và ngủ đủ.",
      "Trong những tuần đầu, sức mạnh và kỹ thuật thường cải thiện trước khi bạn thấy cơ lớn lên. Bạn có thể nhận ra mình nâng nhẹ nhàng hơn hoặc ít mỏi hơn trước khi gương cho thấy sự khác biệt.",
      "Tốc độ phát triển cơ khác nhau ở mỗi người, tùy tuổi, kinh nghiệm tập, giấc ngủ và lịch sinh hoạt. Vì vậy chúng tôi không so sánh bạn với người khác, và bạn cũng không cần làm vậy.",
      "Tập nhiều hơn mức cơ thể phục hồi được thường không giúp cơ phát triển nhanh hơn, mà có thể khiến bạn mệt và khó duy trì.",
    ],
    action: "Ghi lại một bài tập bạn thấy nhẹ nhàng hơn so với tháng trước và chia sẻ với HLV.",
  },
  {
    id: 'PF06', group: 'co-the', approved: true,
    title: 'Giảm mỡ không phải là giảm cân liên tục',
    summary: 'Tiến trình giảm mỡ không nhất thiết đi cùng cân nặng giảm đều mỗi tuần.',
    body: [
      "Giảm mỡ và giảm cân liên tục là hai chuyện khác nhau. Cân nặng của bạn có thể không giảm đều mỗi tuần dù cơ thể vẫn đang thay đổi.",
      "Cân nặng bị ảnh hưởng bởi lượng nước giữ lại, thức ăn trong cơ thể, nhịp sinh hoạt và cả lượng cơ. Nếu bạn vừa giảm mỡ vừa giữ hoặc tăng cơ, số trên cân có thể thay đổi chậm hơn bạn mong đợi.",
      "Quá trình này hiếm khi đi theo một đường thẳng. Có tuần cân giảm, có tuần đứng yên, có tuần tăng nhẹ rồi giảm lại. Điều chúng tôi quan tâm là xu hướng qua nhiều tuần.",
      "Khi cân nặng đứng yên, bạn không cần vội cắt giảm ăn uống hay tập thêm thật nhiều. Hãy cho HLV biết, chúng tôi sẽ xem lại vòng eo, các số đo, mức năng lượng và lịch sinh hoạt của bạn trước khi điều chỉnh.",
      "Cắt giảm mạnh để cân giảm nhanh thường khó duy trì và có thể khiến bạn mệt hơn.",
    ],
    action: "Nhìn vào xu hướng 3 đến 4 tuần gần đây thay vì chỉ lần cân gần nhất.",
  },
  {
    id: 'PF07', group: 'phuc-hoi', approved: true,
    title: 'Giấc ngủ và khả năng phục hồi',
    summary: 'Giấc ngủ là một phần của quá trình cơ thể thích nghi với tập luyện.',
    body: [
      'Giấc ngủ là lúc cơ thể phục hồi sau buổi tập. Khi ngủ ít hơn thường lệ trong vài ngày liên tiếp, bạn có thể thấy mình mệt hơn, tập nặng tay hơn hoặc thèm ăn nhiều hơn bình thường.',
      'Điều này khá phổ biến và thường có lý do rất đời thường: công việc, chăm con, đi lại hay lịch sinh hoạt thay đổi. Chúng tôi không xem đó là lỗi của bạn.',
      'Một vài đêm ngủ ngắn không làm hỏng quá trình tập luyện. Điều quan trọng hơn là xu hướng trong cả tuần.',
      'Nếu giấc ngủ ngắn kéo dài, hãy cho HLV biết. Chúng tôi có thể điều chỉnh khối lượng tập cho phù hợp với mức năng lượng của bạn, thay vì cố giữ nguyên kế hoạch.',
      'Bạn không cần ngủ bù một lần thật dài. Giữ giờ đi ngủ và giờ thức dậy tương đối ổn định thường dễ thực hiện hơn.',
    ],
    action: 'Tối nay, thử đi ngủ sớm hơn thường lệ khoảng 20 phút.',
  },
  {
    id: 'PF08', group: 'phuc-hoi', approved: true,
    title: 'Khi cuộc sống quá bận rộn',
    summary: 'Điều chỉnh kỳ vọng tập luyện khi công việc và cuộc sống thay đổi.',
    body: [
      "Có những giai đoạn công việc dồn dập, gia đình có việc hoặc bạn ngủ ít. Đó là một phần của cuộc sống, không phải dấu hiệu bạn thiếu kỷ luật.",
      "Trong những giai đoạn như vậy, mục tiêu hợp lý thường không phải giữ nguyên mọi thứ, mà là giữ được nhịp. Một buổi tập ngắn hơn, nhẹ hơn vẫn giúp thói quen không bị đứt.",
      "Nếu lịch của bạn thay đổi, hãy báo HLV sớm. Chúng tôi có thể đổi giờ, rút ngắn buổi tập hoặc điều chỉnh khối lượng cho phù hợp với mức năng lượng của bạn lúc này.",
      "Một tuần tập ít hơn bình thường không xóa đi những gì bạn đã xây dựng. Điều quan trọng là quay lại nhịp quen thuộc khi cuộc sống ổn định hơn.",
      "Nếu cảm giác quá tải kéo dài và ảnh hưởng đến sinh hoạt hằng ngày, hãy cân nhắc chia sẻ với người thân hoặc một chuyên gia phù hợp.",
    ],
    action: "Nhắn HLV một câu về lịch tuần này, kể cả khi bạn chưa chắc sẽ tập được bao nhiêu buổi.",
  },
  {
    id: 'PF09', group: 'phuc-hoi', approved: true,
    title: 'Nước và thói quen hằng ngày',
    summary: 'Duy trì đều đặn thay vì cố bù một lần.',
    body: [
      "Uống nước đều đặn trong ngày thường dễ thực hiện và dễ duy trì hơn là cố uống thật nhiều vào buổi tối.",
      "Nhu cầu nước khác nhau ở mỗi người, tùy thời tiết, mức vận động và cơ thể. Mức nước trong app là mốc tham khảo HLV đặt cho bạn, không phải con số bạn phải đạt bằng mọi giá.",
      "Một cách đơn giản là gắn việc uống nước với những thời điểm đã có sẵn trong ngày: sau khi thức dậy, trước mỗi bữa ăn, trước và sau buổi tập, hoặc khi bắt đầu một cuộc họp.",
      "Nếu có ngày bạn uống ít hơn dự định, đừng cố uống bù thật nhiều trong một lần. Hãy quay lại nhịp quen thuộc vào ngày hôm sau.",
      "Nếu bạn có bệnh lý cần kiểm soát lượng nước, hãy làm theo hướng dẫn của bác sĩ thay vì mục tiêu trong app.",
    ],
    action: "Đặt một chai nước ở nơi bạn hay ngồi làm việc và uống vài ngụm mỗi khi nhìn thấy nó.",
  },
  {
    id: 'PF10', group: 'duy-tri', approved: true,
    title: 'Khi bạn lỡ một buổi tập',
    summary: 'Một buổi tập bị bỏ lỡ không quyết định toàn bộ quá trình.',
    body: [
      "Một buổi tập bị lỡ không làm mất đi những gì bạn đã xây dựng. Cơ thể phản ứng với xu hướng qua nhiều tuần, không phản ứng với một ngày.",
      "Lý do lỡ buổi thường rất đời thường: công việc, con ốm, đi lại hay chỉ là một ngày mệt. Chúng tôi không xem đó là lỗi của bạn.",
      "Điều giúp bạn nhiều nhất là báo HLV sớm để cùng sắp xếp lại buổi tập. Bạn không cần tập dồn hai buổi vào một ngày hay tập quá sức để bù lại, vì cách này dễ khiến cơ thể mệt và khó duy trì.",
      "Thay vào đó, hãy quay lại đúng lịch ở buổi kế tiếp. Nếu bạn đã nghỉ vài tuần, chúng tôi có thể bắt đầu nhẹ hơn rồi tăng dần.",
      "Điều quan trọng là bạn vẫn quay lại.",
    ],
    action: "Nhắn HLV để chọn một khung giờ cho buổi tập kế tiếp.",
  },
  {
    id: 'PF11', group: 'duy-tri', approved: true,
    title: 'Một bữa ăn không quyết định hành trình',
    summary: 'Không cần phản ứng cực đoan sau một bữa ăn khác kế hoạch.',
    body: [
      "Một bữa ăn khác kế hoạch, một buổi tiệc hay vài ngày ăn uống thoải mái hơn không quyết định kết quả của cả hành trình. Cơ thể phản ứng với thói quen qua nhiều tuần.",
      "Sau một bữa ăn nhiều hơn dự định, nhiều người có xu hướng nhịn bữa kế tiếp hoặc tập thêm để bù. Cách này thường khiến bạn đói, mệt và dễ ăn quá mức ở bữa sau đó.",
      "Cách đơn giản hơn là ăn bữa kế tiếp đúng như kế hoạch. Không cần ăn ít hơn để bù, và không cần tự trách.",
      "Hôm sau cân nặng có thể cao hơn một chút do nước và thức ăn còn trong cơ thể. Đây thường không phải là mỡ mới tăng lên.",
      "Nếu bạn thường xuyên ăn mất kiểm soát hoặc có cảm giác tội lỗi nặng nề sau khi ăn, hãy trao đổi với HLV hoặc một chuyên gia phù hợp.",
    ],
    action: "Ở bữa kế tiếp, ăn theo kế hoạch như bình thường và uống đủ nước.",
  },
  {
    id: 'PF12', group: 'an-toan', approved: true,
    title: 'Khi nào nên gặp chuyên gia?',
    summary: 'Giới hạn hỗ trợ của HLV và khi nào nên tìm đến nhân viên y tế.',
    body: [
      "HLV có thể hướng dẫn tập luyện và điều chỉnh thói quen sinh hoạt, nhưng chúng tôi không phải bác sĩ. Có những dấu hiệu cần được nhân viên y tế đánh giá trước khi bạn tiếp tục tập.",
      "Bạn nên gặp bác sĩ nếu có đau lan hoặc tê bì xuống tay chân, đau về đêm không liên quan đến vận động, đau cấp kèm sưng hoặc kẹt khớp, mất tầm vận động đột ngột, chấn thương mới chưa được thăm khám, hoặc sụt cân mà bạn không rõ lý do.",
      "Nếu bạn thấy lo âu, buồn bã hoặc kiệt sức kéo dài, hoặc mối quan hệ với việc ăn uống đang khiến bạn khó chịu, hãy nói với bác sĩ hoặc chuyên gia sức khỏe tâm thần. Đó là một cách chăm sóc bản thân, không phải điểm yếu.",
      "Nếu có bất kỳ dấu hiệu nào ở trên, hãy báo HLV. Chúng tôi sẽ dừng hoặc điều chỉnh buổi tập và đề nghị bạn đi khám trước. Đó là điều đúng cho cơ thể bạn, không phải Prime Form từ chối bạn.",
      "Khi cần cấp cứu, hãy gọi 115 hoặc đến cơ sở y tế gần nhất.",
    ],
    action: "Nếu có một triệu chứng khiến bạn băn khoăn, hãy đặt lịch khám và cho HLV biết.",
  },
]
